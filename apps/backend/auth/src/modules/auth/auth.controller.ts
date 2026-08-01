import { prisma } from '../../utils/prisma';
import bcrypt from 'bcryptjs';
import { config } from '../../config';
import { generateOTP, generateSlug } from '@tradenest/common';
import { AppError, NotFoundError, ConflictError, ValidationError } from '@tradenest/common';
import { tokenStore, otpStore } from '../../utils/redis';
import { generateAccessToken, generateRefreshToken, parseTokenExpiry } from '../../utils/jwt';
import { logger } from '../../utils/logger';
import { RegisterDto, LoginDto, VerifyOtpDto, ForgotPasswordDto, ResetPasswordDto, TokenPair, UserRole } from '@tradenest/common';

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: UserRole;
  }) {
    return prisma.user.create({ data });
  }

  async updateUser(id: string, data: Partial<{ firstName: string; lastName: string; phone: string | null; avatarUrl: string | null; isVerified: boolean; isActive: boolean }>) {
    return prisma.user.update({ where: { id }, data });
  }

  async createOtpCode(userId: string, codeHash: string, purpose: string, expiresAt: Date) {
    return prisma.otpCode.create({ data: { userId, codeHash, purpose, expiresAt } });
  }

  async findValidOtpCode(userId: string, purpose: string) {
    return prisma.otpCode.findFirst({
      where: { userId, purpose, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markOtpUsed(id: string) {
    return prisma.otpCode.update({ where: { id }, data: { usedAt: new Date() } });
  }

  async createPasswordReset(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.passwordReset.create({ data: { userId, tokenHash, expiresAt } });
  }

  async findValidPasswordReset(tokenHash: string) {
    return prisma.passwordReset.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  async markPasswordResetUsed(id: string) {
    return prisma.passwordReset.update({ where: { id }, data: { usedAt: new Date() } });
  }

  async createRefreshToken(userId: string, tokenHash: string, expiresAt: Date, userAgent?: string, ipAddress?: string) {
    return prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt, userAgent, ipAddress } });
  }

  async findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  async revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  async revokeAllUserRefreshTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async createSession(userId: string, ipAddress: string, userAgent: string, deviceInfo?: any) {
    return prisma.session.create({ data: { userId, ipAddress, userAgent, deviceInfo } });
  }

  async updateSessionActivity(sessionId: string) {
    return prisma.session.update({ where: { id: sessionId }, data: { lastActiveAt: new Date() } });
  }

  async createAuditLog(userId: string, action: string, entity: string, entityId?: string, metadata?: any, ipAddress?: string, userAgent?: string) {
    return prisma.auditLog.create({ data: { userId, action, entity, entityId, metadata, ipAddress, userAgent } });
  }
}

export class AuthService {
  private repo = new AuthRepository();

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existingUser = await this.repo.findUserByEmail(dto.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, config.BCRYPT_ROUNDS);

    const user = await this.repo.createUser({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: dto.role,
    });

    // Generate and send OTP for email verification
    const otp = generateOTP(config.OTP_LENGTH);
    const otpHash = await bcrypt.hash(otp, config.BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + config.OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.repo.createOtpCode(user.id, otpHash, 'REGISTER', expiresAt);

    // TODO: Send OTP via email/SMS
    logger.info(`Registration OTP for ${dto.email}: ${otp}`);

    return { message: 'Registration successful. Please verify your email with the OTP sent.' };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<TokenPair> {
    const user = await this.repo.findUserByEmail(dto.email);
    if (!user) {
      throw new NotFoundError('User');
    }

    const otpRecord = await this.repo.findValidOtpCode(user.id, 'REGISTER');
    if (!otpRecord) {
      throw new ValidationError('OTP expired or invalid');
    }

    const isValid = await bcrypt.compare(dto.otp, otpRecord.codeHash);
    if (!isValid) {
      throw new ValidationError('Invalid OTP');
    }

    await this.repo.markOtpUsed(otpRecord.id);
    await this.repo.updateUser(user.id, { isVerified: true });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.repo.findUserByEmail(dto.email);
    if (!user) {
      throw new ValidationError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ValidationError('Account is deactivated');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      await this.repo.createAuditLog(user.id, 'LOGIN_FAILED', 'User', user.id, { reason: 'invalid_password' });
      throw new ValidationError('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new ValidationError('Please verify your email first');
    }

    await this.repo.createAuditLog(user.id, 'LOGIN_SUCCESS', 'User', user.id);
    await this.repo.updateUser(user.id, { lastLoginAt: new Date() });

    return this.generateTokens(user);
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const tokenHash = await bcrypt.hash(refreshToken, config.BCRYPT_ROUNDS);
    const storedToken = await this.repo.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw new ValidationError('Invalid refresh token');
    }

    const user = await this.repo.findUserById(storedToken.userId);
    if (!user || !user.isActive) {
      throw new ValidationError('User not found or inactive');
    }

    // Revoke old token
    await this.repo.revokeRefreshToken(storedToken.id);

    return this.generateTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = await bcrypt.hash(refreshToken, config.BCRYPT_ROUNDS);
    const storedToken = await this.repo.findRefreshToken(tokenHash);
    if (storedToken) {
      await this.repo.revokeRefreshToken(storedToken.id);
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.repo.revokeAllUserRefreshTokens(userId);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.repo.findUserByEmail(dto.email);
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const token = generateSlug(Math.random().toString(36).substring(2, 15) + Date.now().toString(36));
    const tokenHash = await bcrypt.hash(token, config.BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.repo.createPasswordReset(user.id, tokenHash, expiresAt);

    // TODO: Send reset email with token
    logger.info(`Password reset token for ${dto.email}: ${token}`);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = await bcrypt.hash(dto.token, config.BCRYPT_ROUNDS);
    const resetRecord = await this.repo.findValidPasswordReset(tokenHash);

    if (!resetRecord) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.password, config.BCRYPT_ROUNDS);
    await this.repo.updateUser(resetRecord.userId, { passwordHash });
    await this.repo.markPasswordResetUsed(resetRecord.id);
    await this.repo.revokeAllUserRefreshTokens(resetRecord.userId);

    return { message: 'Password reset successful' };
  }

  private async generateTokens(user: any): Promise<TokenPair> {
    const accessToken = await generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = await generateRefreshToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshExpiry = parseTokenExpiry(config.JWT_REFRESH_EXPIRY);
    const refreshTokenHash = await bcrypt.hash(refreshToken, config.BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + refreshExpiry * 1000);

    await this.repo.createRefreshToken(user.id, refreshTokenHash, expiresAt);
    await tokenStore.saveRefreshToken(user.id, refreshToken, refreshExpiry);

    return { accessToken, refreshToken };
  }
}

export class AuthController {
  private service = new AuthService();

  register = async (req: any, res: any) => {
    const result = await this.service.register(req.body);
    res.status(201).json(result);
  };

  verifyOtp = async (req: any, res: any) => {
    const result = await this.service.verifyOtp(req.body);
    res.json(result);
  };

  login = async (req: any, res: any) => {
    const result = await this.service.login(req.body);
    res.json(result);
  };

  refresh = async (req: any, res: any) => {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ValidationError('Refresh token required');
    const result = await this.service.refreshTokens(refreshToken);
    res.json(result);
  };

  logout = async (req: any, res: any) => {
    const { refreshToken } = req.body;
    await this.service.logout(refreshToken);
    res.json({ message: 'Logged out successfully' });
  };

  logoutAll = async (req: any, res: any) => {
    const authReq = req as any;
    await this.service.logoutAll(authReq.user.id);
    res.json({ message: 'Logged out from all devices' });
  };

  forgotPassword = async (req: any, res: any) => {
    const result = await this.service.forgotPassword(req.body);
    res.json(result);
  };

  resetPassword = async (req: any, res: any) => {
    const result = await this.service.resetPassword(req.body);
    res.json(result);
  };

  me = async (req: any, res: any) => {
    const authReq = req as any;
    const user = await this.service['repo'].findUserById(authReq.user.id);
    if (!user) throw new NotFoundError('User');
    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  };
}