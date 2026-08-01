import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import Redis from 'ioredis';
import { config } from '../config';

const redis = new Redis(config.REDIS_URL || 'redis://localhost:6379');

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { 
    code: 'RATE_LIMIT_EXCEEDED', 
    message: 'Too many authentication attempts, please try again later' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  keyGenerator: (req: Request) => `auth:${req.ip}:${req.path}`,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { 
    code: 'RATE_LIMIT_EXCEEDED', 
    message: 'Too many requests, please try again later' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  keyGenerator: (req: Request) => `api:${req.ip}`,
});

export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { 
    code: 'RATE_LIMIT_EXCEEDED', 
    message: 'Too many requests, please try again later' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  keyGenerator: (req: Request) => `strict:${req.ip}:${req.path}`,
});

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: { code: string; message: string };
  keyPrefix?: string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || { 
      code: 'RATE_LIMIT_EXCEEDED', 
      message: 'Too many requests' 
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
    }),
    keyGenerator: (req: Request) => `${options.keyPrefix || 'rl'}:${req.ip}:${req.path}`,
  });
}

export function ipWhitelist(allowedIps: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = req.ip || req.socket.remoteAddress || '';
    if (allowedIps.includes(clientIp) || allowedIps.includes('::ffff:' + clientIp)) {
      next();
    } else {
      res.status(403).json({ 
        code: 'FORBIDDEN', 
        message: 'IP not allowed' 
      });
    }
  };
}

export function ipBlacklist(blockedIps: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = req.ip || req.socket.remoteAddress || '';
    if (blockedIps.includes(clientIp) || blockedIps.includes('::ffff:' + clientIp)) {
      res.status(403).json({ 
        code: 'FORBIDDEN', 
        message: 'Access denied' 
      });
    } else {
      next();
    }
  };
}