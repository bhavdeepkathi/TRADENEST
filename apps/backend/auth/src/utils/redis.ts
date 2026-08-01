import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err) => logger.error('Redis error:', err));
    redisClient.on('close', () => logger.warn('Redis connection closed'));
    redisClient.on('reconnecting', () => logger.info('Redis reconnecting...'));
  }
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  const client = getRedisClient();
  if (client.status === 'wait') {
    await client.connect();
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// Token storage helpers
export const tokenStore = {
  async saveRefreshToken(userId: string, token: string, expiresInSeconds: number): Promise<void> {
    const client = getRedisClient();
    const key = `refresh:${userId}:${token.slice(0, 16)}`;
    await client.setex(key, expiresInSeconds, '1');
  },

  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const client = getRedisClient();
    const key = `refresh:${userId}:${token.slice(0, 16)}`;
    const exists = await client.exists(key);
    return exists === 1;
  },

  async revokeRefreshToken(userId: string, token: string): Promise<void> {
    const client = getRedisClient();
    const key = `refresh:${userId}:${token.slice(0, 16)}`;
    await client.del(key);
  },

  async revokeAllUserTokens(userId: string): Promise<void> {
    const client = getRedisClient();
    const pattern = `refresh:${userId}:*`;
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  },
};

// Rate limit helpers
export const rateLimitStore = {
  async increment(key: string, windowMs: number): Promise<{ count: number; ttl: number }> {
    const client = getRedisClient();
    const redisKey = `ratelimit:${key}`;
    const count = await client.incr(redisKey);
    if (count === 1) {
      await client.pexpire(redisKey, windowMs);
    }
    const ttl = await client.pttl(redisKey);
    return { count, ttl: ttl > 0 ? ttl : windowMs };
  },
};

// OTP storage
export const otpStore = {
  async save(email: string, code: string, purpose: string, expiresInSeconds: number): Promise<void> {
    const client = getRedisClient();
    const key = `otp:${purpose}:${email}`;
    await client.setex(key, expiresInSeconds, code);
  },

  async get(email: string, purpose: string): Promise<string | null> {
    const client = getRedisClient();
    const key = `otp:${purpose}:${email}`;
    return client.get(key);
  },

  async delete(email: string, purpose: string): Promise<void> {
    const client = getRedisClient();
    const key = `otp:${purpose}:${email}`;
    await client.del(key);
  },
};