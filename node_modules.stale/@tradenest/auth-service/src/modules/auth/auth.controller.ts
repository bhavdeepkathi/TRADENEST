import crypto from 'crypto';
import { prisma } from '../../utils/prisma';
import bcrypt from 'bcryptjs';
import { config } from '../../config';
import { generateOTP, generateSlug } from '@tradenest/common';
import { AppError, NotFoundError, ConflictError, ValidationError } from '@tradenest/common';
import { tokenStore, otpStore } from '../../utils/redis';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, parseTokenExpiry } from '../../utils/jwt';
import { logger } from '../../utils/logger';
import { RegisterDto, LoginDto, VerifyOtpDto, ForgotPasswordDto, ResetPasswordDto, TokenPair, UserRole, UpdateProfileDto } from '@tradenest/common';
import { OAuth2Client } from 'google-auth-library';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../utils/mailer';

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async findUserById(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    let seller: any = null;
    if (user.role === 'SELLER') {
      const sellers = await prisma.$queryRaw<any[]>`
        SELECT id, "storeName", "kycStatus", "kycRejectionReason", gstin
        FROM "Seller"
        WHERE "userId" = ${id} OR id = ${id}
        LIMIT 1
      `.catch(() => []);
      seller = sellers[0] || null;
    }
    return { ...user, seller };
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

  async updateUser(id: string, data: Partial<{ firstName: string; lastName: string; phone: string | null; avatarUrl: string | null; isVerified: boolean; isActive: boolean; lastLoginAt: Date | null; passwordHash: string }>) {
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
    return prisma.refreshToken.upsert({
      where: { tokenHash },
      update: { expiresAt, revokedAt: null },
      create: { userId, tokenHash, expiresAt, userAgent, ipAddress }
    });
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

  async register(dto: RegisterDto): Promise<{ message: string; devOtp?: string; sentViaSmtp?: boolean }> {
    const existingUser = await this.repo.findUserByEmail(dto.email);
    if (existingUser) {
      if (existingUser.isVerified) {
        throw new ConflictError('This email is already registered and verified. Please log in.');
      }

      // Account was previously created but never verified: update credentials and send fresh OTP
      const passwordHash = await bcrypt.hash(dto.password, config.BCRYPT_ROUNDS);
      await this.repo.updateUser(existingUser.id, {
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      });

      const otp = generateOTP(config.OTP_LENGTH);
      const otpHash = await bcrypt.hash(otp, config.BCRYPT_ROUNDS);
      const expiresAt = new Date(Date.now() + config.OTP_EXPIRY_MINUTES * 60 * 1000);

      await this.repo.createOtpCode(existingUser.id, otpHash, 'REGISTER', expiresAt);
      const emailResult = await sendVerificationEmail(dto.email, otp, dto.firstName);

      return {
        message: emailResult.sentViaSmtp
          ? 'Verification code sent to your email. Please check your inbox (and spam folder).'
          : 'A fresh verification code has been generated.',
        ...(config.NODE_ENV !== 'production' && !emailResult.sentViaSmtp ? { devOtp: otp } : {}),
        sentViaSmtp: emailResult.sentViaSmtp,
      };
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

    if (dto.role === UserRole.SELLER || (dto.role as string) === 'SELLER') {
      await this.ensureSellerAccount(user);
    }

    // Generate and send OTP for email verification
    const otp = generateOTP(config.OTP_LENGTH);
    const otpHash = await bcrypt.hash(otp, config.BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + config.OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.repo.createOtpCode(user.id, otpHash, 'REGISTER', expiresAt);

    // Send branded verification email via SMTP (or fallback logger)
    const emailResult = await sendVerificationEmail(dto.email, otp, dto.firstName);

    return {
      message: emailResult.sentViaSmtp
        ? 'Verification code sent to your email. Please check your inbox (and spam folder).'
        : 'Registration successful. Please verify your email with the OTP sent.',
      ...(config.NODE_ENV !== 'production' && !emailResult.sentViaSmtp ? { devOtp: otp } : {}),
      sentViaSmtp: emailResult.sentViaSmtp,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<any> {
    const user = await this.repo.updateUser(userId, dto);
    if (!user) throw new NotFoundError('User');
    const { passwordHash, ...safeUser } = user;
    return safeUser;
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

    if (user.role === UserRole.SELLER || (user.role as string) === 'SELLER') {
      await this.ensureSellerAccount(user);
    }

    return this.generateTokens(user);
  }

  async ensureSellerAccount(user: { id: string; email: string; firstName: string; lastName: string }) {
    try {
      const sellerId = 'seller_' + user.id.slice(-12);
      const storeName = `${user.firstName}'s Store`;

      const existing = await prisma.$queryRaw<any[]>`
        SELECT "id" FROM "Seller" WHERE "userId" = ${user.id} LIMIT 1
      `.catch(() => []);

      if (!existing || existing.length === 0) {
        await prisma.$executeRaw`
          INSERT INTO "Seller" ("id", "userId", "storeName", "kycStatus", "totalRevenue", "totalOrders", "createdAt", "updatedAt")
          VALUES (${sellerId}, ${user.id}, ${storeName}, 'PENDING'::"KYCStatus", 0, 0, NOW(), NOW())
          ON CONFLICT ("userId") DO NOTHING
        `;

        // Send notifications to all SUPER_ADMIN and ADMIN users
        const admins = await prisma.user.findMany({
          where: { role: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN] } },
          select: { id: true, email: true },
        });

        for (const admin of admins) {
          const notifId = 'notif_' + Math.random().toString(36).substring(2, 11);
          const title = 'New Seller Registration Request';
          const body = `New seller request: ${user.firstName} ${user.lastName} (${user.email}). Store: "${storeName}". Pending KYC review.`;
          const dataJson = JSON.stringify({
            type: 'SELLER_REGISTRATION',
            sellerId,
            userId: user.id,
            email: user.email,
            storeName,
          });

          await prisma.$executeRaw`
            INSERT INTO "Notification" ("id", "userId", "type", "title", "body", "data", "read", "createdAt")
            VALUES (${notifId}, ${admin.id}, 'SYSTEM'::"NotificationType", ${title}, ${body}, ${dataJson}::jsonb, false, NOW())
          `;
        }
        logger.info(`✅ Created Seller record and notified ${admins.length} admin(s) for user: ${user.email}`);
      }
    } catch (err: any) {
      logger.error('Failed in ensureSellerAccount:', err);
    }
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
      const otp = generateOTP(config.OTP_LENGTH);
      const otpHash = await bcrypt.hash(otp, config.BCRYPT_ROUNDS);
      const expiresAt = new Date(Date.now() + config.OTP_EXPIRY_MINUTES * 60 * 1000);
      await this.repo.createOtpCode(user.id, otpHash, 'REGISTER', expiresAt);
      await sendVerificationEmail(user.email, otp, user.firstName);
      throw new ValidationError('Please verify your email first. A fresh 6-digit verification code has been dispatched to your email.');
    }

    await this.repo.createAuditLog(user.id, 'LOGIN_SUCCESS', 'User', user.id);
    await this.repo.updateUser(user.id, { lastLoginAt: new Date() });

    return this.generateTokens(user);
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    let payload: any;
    try {
      payload = await verifyRefreshToken(refreshToken);
    } catch {
      throw new ValidationError('Invalid or expired refresh token');
    }

    const user = await this.repo.findUserById(payload.sub);
    if (!user || !user.isActive) {
      throw new ValidationError('User not found or inactive');
    }

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
      return { message: 'If the email exists, a reset link has been sent to your email' };
    }

    const token = generateSlug(Math.random().toString(36).substring(2, 15) + Date.now().toString(36));
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.repo.createPasswordReset(user.id, tokenHash, expiresAt);

    await sendPasswordResetEmail(user.email, token, user.firstName);
    logger.info(`Password reset token for ${dto.email}: ${token}`);

    return {
      message: 'If the email exists, a reset link has been sent to your email',
      ...(config.NODE_ENV !== 'production' ? { devResetToken: token } : {}),
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = crypto.createHash('sha256').update(dto.token ? dto.token.trim() : '').digest('hex');
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
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + refreshExpiry * 1000);

    await this.repo.createRefreshToken(user.id, refreshTokenHash, expiresAt).catch(() => {});
    await tokenStore.saveRefreshToken(user.id, refreshToken, refreshExpiry);

    return { accessToken, refreshToken };
  }

  async resendOtp(email: string): Promise<{ message: string; devOtp?: string; sentViaSmtp: boolean }> {
    const user = await this.repo.findUserByEmail(email);
    if (!user) {
      throw new NotFoundError('User');
    }
    if (user.isVerified) {
      throw new ValidationError('Account is already verified');
    }

    const otp = generateOTP(config.OTP_LENGTH);
    const otpHash = await bcrypt.hash(otp, config.BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + config.OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.repo.createOtpCode(user.id, otpHash, 'REGISTER', expiresAt);
    const emailResult = await sendVerificationEmail(user.email, otp, user.firstName);

    return {
      message: emailResult.sentViaSmtp
        ? 'A fresh verification code has been dispatched to your email inbox.'
        : 'A fresh verification code has been generated.',
      ...(config.NODE_ENV !== 'production' && !emailResult.sentViaSmtp ? { devOtp: otp } : {}),
      sentViaSmtp: emailResult.sentViaSmtp,
    };
  }

  async googleLogin(credential: string, role?: string): Promise<TokenPair & { user: any }> {
    let payload: any;
    try {
      const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: config.GOOGLE_CLIENT_ID || undefined,
      });
      payload = ticket.getPayload();
    } catch {
      // Fallback verification via Google's tokeninfo endpoint
      try {
        const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (!res.ok) throw new Error('Token verification failed');
        payload = await res.json();
      } catch {
        throw new ValidationError('Invalid or expired Google credential token');
      }
    }

    if (!payload || !payload.email) {
      throw new ValidationError('Could not extract email address from Google token');
    }

    const email = String(payload.email).toLowerCase();
    const firstName = payload.given_name || payload.name?.split(' ')[0] || 'Google';
    const lastName = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || 'User';
    const avatarUrl = payload.picture || null;

    let user = await this.repo.findUserByEmail(email);
    if (user) {
      if (!user.isVerified || (!user.avatarUrl && avatarUrl)) {
        user = await this.repo.updateUser(user.id, {
          isVerified: true,
          ...(avatarUrl && !user.avatarUrl ? { avatarUrl } : {}),
        });
      }
    } else {
      const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const passwordHash = await bcrypt.hash(randomPassword, config.BCRYPT_ROUNDS);
      const userRole = role === 'SELLER' ? UserRole.SELLER : UserRole.CUSTOMER;
      user = await this.repo.createUser({
        email,
        passwordHash,
        firstName,
        lastName,
        role: userRole,
      });
      user = await this.repo.updateUser(user.id, {
        isVerified: true,
        avatarUrl,
      });
    }

    if (!user.isActive) {
      throw new ValidationError('Account is deactivated');
    }

    if (user.role === UserRole.SELLER || (user.role as string) === 'SELLER') {
      await this.ensureSellerAccount(user);
    }

    await this.repo.createAuditLog(user.id, 'GOOGLE_LOGIN_SUCCESS', 'User', user.id);
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isVerified: user.isVerified,
      },
    };
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

  googleLogin = async (req: any, res: any) => {
    const { credential, role } = req.body;
    if (!credential) throw new ValidationError('Google credential token is required');
    const result = await this.service.googleLogin(credential, role);
    res.json(result);
  };

  resendOtp = async (req: any, res: any) => {
    const { email } = req.body;
    if (!email) throw new ValidationError('Email is required');
    const result = await this.service.resendOtp(email);
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

  updateProfile = async (req: any, res: any) => {
    const authReq = req as any;
    const result = await this.service.updateProfile(authReq.user.id, req.body);
    res.json(result);
  };
}