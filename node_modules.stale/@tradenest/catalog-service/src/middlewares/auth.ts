import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { jwtVerify } from 'jose';
import { JwtPayload } from '@tradenest/common';

const encoder = new TextEncoder();
const accessSecret = encoder.encode(config.JWT_SECRET);

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, accessSecret, {
      issuer: config.JWT_ISSUER,
      audience: config.JWT_AUDIENCE,
    });
    
    req.headers['x-user-id'] = payload.sub as string;
    req.headers['x-user-role'] = payload.role as string;
    req.headers['x-user-email'] = payload.email as string;
    
    next();
  } catch (error) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);

  jwtVerify(token, accessSecret, {
    issuer: config.JWT_ISSUER,
    audience: config.JWT_AUDIENCE,
  })
    .then(({ payload }) => {
      req.headers['x-user-id'] = payload.sub as string;
      req.headers['x-user-role'] = payload.role as string;
      req.headers['x-user-email'] = payload.email as string;
      next();
    })
    .catch(() => {
      next();
    });
}