import { UserRole } from '@tradenest/common';
import { TokenClaims } from '../jwt';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  sessionId?: string;
  permissions?: string[];
}

export function mapTokenToUser(claims: TokenClaims): AuthenticatedUser {
  return {
    id: claims.sub,
    email: claims.email,
    role: claims.role,
    sessionId: claims.sessionId,
    permissions: claims.permissions,
  };
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  CUSTOMER: 1,
  SELLER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (user: AuthenticatedUser): boolean => {
    return allowedRoles.some(role => hasRole(user.role, role));
  };
}

export function requireAnyRole(user: AuthenticatedUser, roles: UserRole[]): boolean {
  return roles.some(role => hasRole(user.role, role));
}

export function requireAllRoles(user: AuthenticatedUser, roles: UserRole[]): boolean {
  return roles.every(role => hasRole(user.role, role));
}

export const PERMISSIONS: Record<string, UserRole[]> = {
  'users:read': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'users:write': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'users:delete': [UserRole.SUPER_ADMIN],
  'sellers:read': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'sellers:write': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'sellers:approve': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'products:read': [UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'products:write': [UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'products:delete': [UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'products:approve': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'orders:read': [UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'orders:write': [UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'orders:manage': [UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'payments:read': [UserRole.CUSTOMER, UserRole.SELLER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'payments:write': [UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'payments:refund': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'coupons:read': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'coupons:write': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'analytics:read': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'system:monitor': [UserRole.SUPER_ADMIN],
  'system:config': [UserRole.SUPER_ADMIN],
};

export function hasPermission(user: AuthenticatedUser, permission: string): boolean {
  const requiredRoles = PERMISSIONS[permission];
  if (!requiredRoles) return false;
  return requiredRoles.some(role => hasRole(user.role, role));
}

export function requirePermission(...permissions: string[]) {
  return (user: AuthenticatedUser): boolean => {
    return permissions.every(p => hasPermission(user, p));
  };
}

export function requireAnyPermission(user: AuthenticatedUser, permissions: string[]): boolean {
  return permissions.some(p => hasPermission(user, p));
}

export function canAccessResource(
  user: AuthenticatedUser,
  resourceOwnerId: string,
  options?: { allowAdmin?: boolean; allowSeller?: boolean }
): boolean {
  if (user.id === resourceOwnerId) return true;
  if (options?.allowAdmin && hasRole(user.role, UserRole.ADMIN)) return true;
  if (options?.allowSeller && hasRole(user.role, UserRole.SELLER)) return true;
  return false;
}