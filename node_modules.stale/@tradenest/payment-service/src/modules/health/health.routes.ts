import { Router } from 'express';
import { prisma } from '../../utils/prisma';
import { getRedisClient } from '../../utils/redis';
import { asyncHandler } from '../../middlewares/errorHandler';
import { config } from '../../config';

const router = Router();
router.get('/', asyncHandler(async (req, res) => {
  const checks = { status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime(), environment: config.NODE_ENV, services: {} as Record<string, { status: string; latency?: number; error?: string }> };
  const dbStart = Date.now();
  try { await prisma.$queryRaw`SELECT 1`; checks.services.database = { status: 'healthy', latency: Date.now() - dbStart }; }
  catch (error: any) { checks.services.database = { status: 'unhealthy', error: error.message }; checks.status = 'degraded'; }
  const redisStart = Date.now();
  try { const redis = getRedisClient(); await redis.ping(); checks.services.redis = { status: 'healthy', latency: Date.now() - redisStart }; }
  catch (error: any) { checks.services.redis = { status: 'unhealthy', error: error.message }; checks.status = 'degraded'; }
  res.status(checks.status === 'healthy' ? 200 : 503).json(checks);
}));
export { router as healthRouter };