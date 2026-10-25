import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { config } from '../config';
import { JwtPayload } from '@tradenest/common';

const encoder = new TextEncoder();
const accessSecret = encoder.encode(config.JWT_SECRET);
const refreshSecret = encoder.encode(config.JWT_REFRESH_SECRET);

export async function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setJti(Math.random().toString(36).substring(2) + Date.now().toString(36))
    .setIssuer(config.JWT_ISSUER)
    .setAudience(config.JWT_AUDIENCE)
    .setExpirationTime(config.JWT_ACCESS_EXPIRY)
    .sign(accessSecret);
}

export async function generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
  return new SignJWT({ ...payload, jti: nonce })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setJti(nonce)
    .setIssuer(config.JWT_ISSUER)
    .setAudience(config.JWT_AUDIENCE)
    .setExpirationTime(config.JWT_REFRESH_EXPIRY)
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, accessSecret);
  return payload as unknown as JwtPayload;
}

export async function verifyRefreshToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, refreshSecret);
  return payload as unknown as JwtPayload;
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export function parseTokenExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // default 15m
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