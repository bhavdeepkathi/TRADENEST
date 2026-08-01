import { SignJWT, jwtVerify, JWTPayload, createSecretKey } from 'jose';
import { getAuthConfig } from '../config';
import { JwtPayload, UserRole } from '@tradenest/common';

const encoder = new TextEncoder();

function getAccessSecret(): Uint8Array {
  const cfg = getAuthConfig();
  return encoder.encode(cfg.jwtSecret);
}

function getRefreshSecret(): Uint8Array {
  const cfg = getAuthConfig();
  return encoder.encode(cfg.jwtRefreshSecret);
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenClaims extends JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  sessionId?: string;
  permissions?: string[];
}

export async function generateAccessToken(
  payload: Omit<TokenClaims, 'iat' | 'exp' | 'iss' | 'aud'>,
  options?: { expiresIn?: string }
): Promise<string> {
  const cfg = getAuthConfig();
  const expiry = options?.expiresIn || cfg.jwtAccessExpiry;
  
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: cfg.jwtAlgorithm })
    .setIssuedAt()
    .setIssuer(cfg.issuer)
    .setAudience(cfg.audience)
    .setExpirationTime(expiry)
    .sign(getAccessSecret());
}

export async function generateRefreshToken(
  payload: Omit<TokenClaims, 'iat' | 'exp' | 'iss' | 'aud'>,
  options?: { expiresIn?: string }
): Promise<string> {
  const cfg = getAuthConfig();
  const expiry = options?.expiresIn || cfg.jwtRefreshExpiry;
  
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: cfg.jwtAlgorithm })
    .setIssuedAt()
    .setIssuer(cfg.issuer)
    .setAudience(cfg.audience)
    .setExpirationTime(expiry)
    .sign(getRefreshSecret());
}

export async function generateTokenPair(
  payload: Omit<TokenClaims, 'iat' | 'exp' | 'iss' | 'aud'>
): Promise<TokenPair> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);
  return { accessToken, refreshToken };
}

export async function verifyAccessToken(token: string): Promise<TokenClaims> {
  const cfg = getAuthConfig();
  const { payload } = await jwtVerify(token, getAccessSecret(), {
    issuer: cfg.issuer,
    audience: cfg.audience,
    clockTolerance: cfg.clockTolerance,
  });
  return payload as unknown as TokenClaims;
}

export async function verifyRefreshToken(token: string): Promise<TokenClaims> {
  const cfg = getAuthConfig();
  const { payload } = await jwtVerify(token, getRefreshSecret(), {
    issuer: cfg.issuer,
    audience: cfg.audience,
    clockTolerance: cfg.clockTolerance,
  });
  return payload as unknown as TokenClaims;
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export function parseTokenExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 900;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 900;
  }
}

export async function decodeTokenWithoutVerification(token: string): Promise<TokenClaims | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return payload as TokenClaims;
  } catch {
    return null;
  }
}