import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

let redisClient: Redis | null = null;
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(config.REDIS_URL, { maxRetriesPerRequest: 3, retryStrategy: (times) => Math.min(times * 50, 2000), lazyConnect: true });
    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err) => logger.error('Redis error:', err));
  }
  return redisClient;
}
export async function connectRedis(): Promise<void> { const client = getRedisClient(); if (client.status === 'wait') await client.connect(); }
export async function disconnectRedis(): Promise<void> { if (redisClient) { await redisClient.quit(); redisClient = null; } }