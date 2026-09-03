import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyAccessToken, TokenClaims } from '../jwt';
import { mapTokenToUser, AuthenticatedUser, requireRole, requirePermission } from '../guards/rbac';
import { AuthenticationError, AuthorizationError } from '@tradenest/common';

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  tokenClaims?: TokenClaims;
}

export function createAuthMiddleware(options?: {
  optional?: boolean;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers?.authorization;
      const tokenStr = typeof authHeader === 'string' ? authHeader : Array.isArray(authHeader) ? authHeader[0] : undefined;
      const token = extractTokenFromHeader(tokenStr);
      
      if (!token) {
        if (options?.optional) {
          next();
          return;
        }
        throw new AuthenticationError('Access token required');
      }

      const claims = await verifyAccessToken(token);
      const user = mapTokenToUser(claims);
      
      req.user = user;
      req.tokenClaims = claims;

      // Check role requirements
      if (options?.requiredRoles && options.requiredRoles.length > 0) {
        const hasRequiredRole = options.requiredRoles.some(role => 
          requireRole(role as any)(user)
        );
        if (!hasRequiredRole) {
          throw new AuthorizationError(`Required roles: ${options.requiredRoles.join(', ')}`);
        }
      }

      // Check permission requirements
      if (options?.requiredPermissions && options.requiredPermissions.length > 0) {
        const hasRequiredPerm = options.requiredPermissions.every(perm => 
          requirePermission(perm)(user)
        );
        if (!hasRequiredPerm) {
          throw new AuthorizationError(`Required permissions: ${options.requiredPermissions.join(', ')}`);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export const authMiddleware = createAuthMiddleware({ optional: false });
export const optionalAuthMiddleware = createAuthMiddleware({ optional: true });

export function requireRoles(...roles: string[]) {
  return createAuthMiddleware({ requiredRoles: roles });
}

export function requirePermissions(...permissions: string[]) {
  return createAuthMiddleware({ requiredPermissions: permissions });
}

export function requireRoleOrPermission(roles: string[], permissions: string[]) {
  return createAuthMiddleware({ 
    requiredRoles: roles,
    requiredPermissions: permissions,
  });
}

export function attachUser(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // This middleware assumes authMiddleware has already run
  if (!req.user) {
    throw new AuthenticationError('User not authenticated');
  }
  next();
}

export function getCurrentUser(req: AuthenticatedRequest): AuthenticatedUser | null {
  return req.user || null;
}

export function assertAuthenticated(req: AuthenticatedRequest): AuthenticatedUser {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }
  return req.user;
}