import { Request, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '@tradenest/auth/middleware/auth';
import { serviceRoutes } from '../routes/proxy';

export function createRouteAuthMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const route = serviceRoutes.find(r => req.path.startsWith(r.path));
    
    if (!route) {
      // No matching route, let it pass through (will 404 later)
      next();
      return;
    }

    if (route.authRequired) {
      authMiddleware(req as AuthenticatedRequest, res, next);
    } else {
      optionalAuthMiddleware(req as AuthenticatedRequest, res, next);
    }
  };
}

export function addSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error('Gateway error:', err);
  
  const statusCode = (err as any).statusCode || 500;
  const code = (err as any).code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({ code, message });
}