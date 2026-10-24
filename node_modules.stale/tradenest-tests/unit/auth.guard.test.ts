import { describe, it, expect } from 'vitest';

export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';

export interface AuthContext {
  userId?: string;
  role?: UserRole;
  isActive: boolean;
  isVerified: boolean;
}

export function canAccessRoute(
  user: AuthContext | null,
  allowedRoles: UserRole[]
): { allowed: boolean; reason?: string } {
  if (!user || !user.userId) {
    return { allowed: false, reason: 'UNAUTHENTICATED' };
  }

  if (!user.isActive) {
    return { allowed: false, reason: 'ACCOUNT_SUSPENDED' };
  }

  if (!user.role || !allowedRoles.includes(user.role)) {
    return { allowed: false, reason: 'FORBIDDEN_ROLE' };
  }

  return { allowed: true };
}

describe('Role-Based Access Control Guards', () => {
  const customerUser: AuthContext = {
    userId: 'usr-1',
    role: 'CUSTOMER',
    isActive: true,
    isVerified: true,
  };

  const sellerUser: AuthContext = {
    userId: 'usr-2',
    role: 'SELLER',
    isActive: true,
    isVerified: true,
  };

  const adminUser: AuthContext = {
    userId: 'usr-3',
    role: 'ADMIN',
    isActive: true,
    isVerified: true,
  };

  const superAdminUser: AuthContext = {
    userId: 'usr-4',
    role: 'SUPER_ADMIN',
    isActive: true,
    isVerified: true,
  };

  const suspendedAdmin: AuthContext = {
    userId: 'usr-5',
    role: 'ADMIN',
    isActive: false,
    isVerified: true,
  };

  it('blocks unauthenticated requests from protected routes', () => {
    const res = canAccessRoute(null, ['CUSTOMER', 'SELLER', 'ADMIN']);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('UNAUTHENTICATED');
  });

  it('blocks suspended accounts even with admin credentials', () => {
    const res = canAccessRoute(suspendedAdmin, ['ADMIN', 'SUPER_ADMIN']);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('ACCOUNT_SUSPENDED');
  });

  it('allows CUSTOMER on customer-allowed routes', () => {
    const res = canAccessRoute(customerUser, ['CUSTOMER', 'ADMIN']);
    expect(res.allowed).toBe(true);
  });

  it('prevents regular CUSTOMER from accessing admin routes', () => {
    const res = canAccessRoute(customerUser, ['ADMIN', 'SUPER_ADMIN']);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('FORBIDDEN_ROLE');
  });

  it('allows SELLER on seller routes', () => {
    const res = canAccessRoute(sellerUser, ['SELLER', 'ADMIN', 'SUPER_ADMIN']);
    expect(res.allowed).toBe(true);
  });

  it('allows both ADMIN and SUPER_ADMIN on admin routes', () => {
    expect(canAccessRoute(adminUser, ['ADMIN', 'SUPER_ADMIN']).allowed).toBe(true);
    expect(canAccessRoute(superAdminUser, ['ADMIN', 'SUPER_ADMIN']).allowed).toBe(true);
  });
});
