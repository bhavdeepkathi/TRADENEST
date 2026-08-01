import pino from 'pino';
import { config } from '../config';

const isDevelopment = config.NODE_ENV === 'development';

export const logger = pino({
  level: config.LOG_LEVEL,
  transport: isDevelopment ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss Z' } } : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  base: { service: 'catalog-service', env: config.NODE_ENV },
});