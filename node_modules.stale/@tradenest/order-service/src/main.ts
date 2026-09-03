import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { orderRouter } from './modules/order/order.routes';
import { healthRouter } from './modules/health/health.routes';
import { connectRedis } from './utils/redis';
import { prisma } from './utils/prisma';
import { logger } from './utils/logger';

async function bootstrap() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
  
  const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
  });
  app.use('/api/', limiter);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (config.NODE_ENV !== 'test') {
    app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
  }

  app.use('/health', healthRouter);
  app.use('/api/orders', orderRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  await connectRedis();

  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Database connected');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  const server = app.listen(config.PORT, config.HOST, () => {
    logger.info(`🚀 Order service running on http://${config.HOST}:${config.PORT}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    server.close(async () => { await prisma.$disconnect(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => { logger.error('Failed to start server:', error); process.exit(1); });