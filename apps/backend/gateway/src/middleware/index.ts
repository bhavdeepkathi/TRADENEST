import { Request, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthMiddleware, AuthenticatedRequest } from '@tradenest/auth';
import { serviceRoutes } from '../routes/proxy';

export function createRouteAuthMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestPath = req.originalUrl.split('?')[0];
    const route = serviceRoutes.find(r => requestPath.startsWith(r.path));
    
    console.log(`[Auth] ${req.method} ${requestPath} -> route: ${route?.path}, authRequired: ${route?.authRequired}`);
    
    if (!route) {
      console.log(`[Auth] No route found for ${requestPath}`);
      next();
      return;
    }

    if (route.authRequired) {
      console.log(`[Auth] Using authMiddleware for ${requestPath}`);
      authMiddleware(req as AuthenticatedRequest, res, next);
    } else {
      console.log(`[Auth] Using optionalAuthMiddleware for ${requestPath}`);
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
  
  const isAuthError = 
    (err as any).name === 'AuthenticationError' ||
    (err as any).code === 'AUTHENTICATION_ERROR' ||
    (err as any).name === 'TokenExpiredError' ||
    (err as any).name === 'JsonWebTokenError' ||
    (err as any).name === 'JWTExpired' ||
    (err as any).name === 'JWTInvalid' ||
    (err as any).name === 'JWSSignatureVerificationFailed' ||
    (err as any).name === 'JOSEError' ||
    (typeof (err as any).code === 'string' && (err as any).code.startsWith('ERR_JWT_')) ||
    (typeof (err as any).code === 'string' && (err as any).code.startsWith('ERR_JWS_')) ||
    Boolean(err.message && (
      err.message.includes('claim timestamp check failed') ||
      err.message.includes('signature verification failed') ||
      err.message.includes('Invalid Compact JWS') ||
      err.message.includes('Access token')
    ));

  const statusCode = isAuthError ? 401 : ((err as any).statusCode || 500);
  const code = isAuthError ? 'AUTHENTICATION_ERROR' : ((err as any).code || 'INTERNAL_ERROR');
  const message = isAuthError 
    ? (err.message || 'Access token invalid or expired. Please sign in again.')
    : (err.message || 'Internal server error');
  
  res.status(statusCode).json({ code, message });
}