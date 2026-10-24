import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyAccessToken } from '../utils/jwt';
import { AuthenticationError, AuthorizationError } from '@tradenest/common';
import { UserRole } from '@tradenest/common';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export async function authGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractTokenFromHeader(req.headers.authorization);
  if (token) {
    try {
      const payload = await verifyAccessToken(token);
      (req as AuthenticatedRequest).user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      return next();
    } catch {
      // Token verification failed; fall back to gateway headers if set
    }
  }

  // Check if API Gateway proxy authenticated and forwarded user headers
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as UserRole;
  const userEmail = (req.headers['x-user-email'] as string) || '';

  if (userId && userRole) {
    (req as AuthenticatedRequest).user = {
      id: userId,
      email: userEmail,
      role: userRole,
    };
    return next();
  }

  throw new AuthenticationError('Access token required');
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      throw new AuthenticationError('Authentication required');
    }
    if (!allowedRoles.includes(authReq.user.role)) {
      throw new AuthorizationError(`Required roles: ${allowedRoles.join(', ')}`);
    }
    next();
  };
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractTokenFromHeader(req.headers.authorization);
  if (!token) {
    next();
    return;
  }

  try {
    const payload = await verifyAccessToken(token);
    (req as AuthenticatedRequest).user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
}