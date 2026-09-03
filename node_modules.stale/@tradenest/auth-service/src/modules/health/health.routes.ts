import { Router } from 'express';
import { prisma } from '../../utils/prisma';
import { getRedisClient } from '../../utils/redis';
import { asyncHandler } from '../../middlewares/errorHandler';
import { config } from '../../config';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    version: process.env.npm_package_version || '0.1.0',
    services: {} as Record<string, { status: string; latency?: number; error?: string }>,
  };

  // Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.services.database = { status: 'healthy', latency: Date.now() - dbStart };
  } catch (error: any) {
    checks.services.database = { status: 'unhealthy', error: error.message };
    checks.status = 'degraded';
  }

  // Redis check
  const redisStart = Date.now();
  try {
    const redis = getRedisClient();
    await redis.ping();
    checks.services.redis = { status: 'healthy', latency: Date.now() - redisStart };
  } catch (error: any) {
    checks.services.redis = { status: 'unhealthy', error: error.message };
    checks.status = 'degraded';
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(checks);
}));

router.get('/ready', asyncHandler(async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redis = getRedisClient();
    await redis.ping();
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not ready' });
  }
}));

router.get('/live', (req, res) => {
  res.json({ status: 'alive' });
});

export { router as healthRouter };