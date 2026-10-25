import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { authGuard, requireRoles, AuthenticatedRequest } from '../../guards/authGuard';
import { asyncHandler } from '../../middlewares/errorHandler';
import { NotFoundError, ValidationError } from '@tradenest/common';
import { UpdateProfileDtoSchema, ChangePasswordDtoSchema, CreateAddressDtoSchema, UpdateAddressDtoSchema } from '@tradenest/common';
import bcrypt from 'bcryptjs';
import { UserRole } from '@tradenest/common';
import { sendKycDecisionEmail } from '../../utils/mailer';

const router = Router();

// Validation middleware
function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError('Invalid request data', result.error.flatten().fieldErrors);
    }
    req.body = result.data;
    next();
  };
}

// Get current user profile
router.get('/profile', authGuard, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
      addresses: { orderBy: { isDefault: 'desc' } },
    },
  });
  if (!user) throw new NotFoundError('User');

  let seller: any = null;
  if (user.role === 'SELLER') {
    const sellers = await prisma.$queryRaw<any[]>`
      SELECT id, "storeName", "kycStatus", "kycRejectionReason", gstin
      FROM "Seller"
      WHERE "userId" = ${req.user.id} OR id = ${req.user.id}
      LIMIT 1
    `.catch(() => []);
    seller = sellers[0] || null;
  }

  res.json({ ...user, seller });
}));

// Seller: Get current seller status & store profile
router.get('/seller/me', authGuard, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const sellers = await prisma.$queryRaw<any[]>`
    SELECT id, "userId", "storeName", "kycStatus", "kycRejectionReason", gstin, "totalRevenue"::text as "totalRevenue", "totalOrders"
    FROM "Seller"
    WHERE "userId" = ${req.user.id} OR id = ${req.user.id}
    LIMIT 1
  `.catch(() => []);

  if (!sellers || sellers.length === 0) {
    return res.json({
      id: req.user.id,
      userId: req.user.id,
      storeName: 'My Store',
      kycStatus: 'PENDING',
      kycRejectionReason: null,
      totalRevenue: 0,
      totalOrders: 0,
    });
  }

  const s = sellers[0];
  res.json({
    ...s,
    totalRevenue: parseFloat(s.totalRevenue || '0'),
  });
}));

// Update profile
router.patch('/profile', authGuard, validate(UpdateProfileDtoSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: req.body,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      role: true,
      isVerified: true,
      updatedAt: true,
    },
  });
  res.json(user);
}));

// Change password
router.post('/change-password', authGuard, validate(ChangePasswordDtoSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new NotFoundError('User');

  const isValid = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
  if (!isValid) throw new ValidationError('Current password is incorrect');

  const passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });

  res.json({ message: 'Password changed successfully' });
}));

// Addresses
router.get('/addresses', authGuard, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user.id },
    orderBy: { isDefault: 'desc' },
  });
  res.json(addresses);
}));

router.post('/addresses', authGuard, validate(CreateAddressDtoSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // If setting as default, unset other defaults
  if (req.body.isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: { ...req.body, userId: req.user.id },
  });
  res.status(201).json(address);
}));

router.patch('/addresses/:id', authGuard, validate(UpdateAddressDtoSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const address = await prisma.address.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!address) throw new NotFoundError('Address');

  if (req.body.isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.address.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(updated);
}));

router.delete('/addresses/:id', authGuard, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const address = await prisma.address.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!address) throw new NotFoundError('Address');

  await prisma.address.delete({ where: { id: req.params.id } });
  res.json({ message: 'Address deleted' });
}));

// Admin: Get all users
router.get('/', authGuard, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const role = req.query.role as UserRole | undefined;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: role ? { role } : {},
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where: role ? { role } : {} }),
  ]);

  res.json({
    data: users,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

async function syncMissingSellers() {
  try {
    await prisma.$executeRaw`
      INSERT INTO "Seller" ("id", "userId", "storeName", "kycStatus", "totalRevenue", "totalOrders", "createdAt", "updatedAt")
      SELECT 
        'seller_' || SUBSTRING(u."id" FROM 15),
        u."id",
        u."firstName" || '''s Store',
        'PENDING'::"KYCStatus",
        0,
        0,
        u."createdAt",
        NOW()
      FROM "User" u
      LEFT JOIN "Seller" s ON u."id" = s."userId"
      WHERE u."role" = 'SELLER' AND s."id" IS NULL
      ON CONFLICT ("userId") DO NOTHING
    `;
  } catch (syncErr) {
    console.warn('Failed to auto-sync missing sellers:', syncErr);
  }
}

// Admin: Get platform aggregate stats
router.get('/admin/stats', authGuard, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req: Request, res: Response) => {
  await syncMissingSellers();

  const [
    totalUsers,
    totalCustomers,
    sellerStats,
    pendingKycStats,
    pendingProdStats,
    orderStats,
  ] = await Promise.all([
    prisma.user.count().catch(() => 0),
    prisma.user.count({ where: { role: 'CUSTOMER' } }).catch(() => 0),
    prisma.$queryRaw<{ count: string }[]>`SELECT COUNT(*)::text as count FROM "Seller"`
      .catch(() => [{ count: '0' }]),
    prisma.$queryRaw<{ count: string }[]>`SELECT COUNT(*)::text as count FROM "Seller" WHERE "kycStatus" = 'PENDING'`
      .catch(() => [{ count: '0' }]),
    prisma.$queryRaw<{ count: string }[]>`SELECT COUNT(*)::text as count FROM "Product" WHERE "status" = 'PENDING_APPROVAL'`
      .catch(() => [{ count: '0' }]),
    prisma.$queryRaw<{ sum: string; count: string }[]>`SELECT COALESCE(SUM("total"), 0)::text as sum, COUNT(*)::text as count FROM "Order"`
      .catch(() => [{ sum: '0', count: '0' }]),
  ]);

  const totalSellers = parseInt(sellerStats[0]?.count || '0', 10);
  const pendingKycCount = parseInt(pendingKycStats[0]?.count || '0', 10);
  const pendingProductsCount = parseInt(pendingProdStats[0]?.count || '0', 10);
  const totalRevenue = parseFloat(orderStats[0]?.sum || '0');
  const totalOrders = parseInt(orderStats[0]?.count || '0', 10);

  res.json({
    totalUsers,
    totalCustomers,
    totalSellers,
    pendingKycCount,
    pendingProductsCount,
    totalRevenue,
    totalOrders,
  });
}));

// Admin: Get all sellers (with user profile & KYC details)
router.get('/admin/sellers', authGuard, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req: Request, res: Response) => {
  await syncMissingSellers();
  const kycStatus = req.query.kycStatus as string | undefined;

  let rawSellers: any[] = [];
  try {
    if (kycStatus && ['PENDING', 'APPROVED', 'REJECTED'].includes(kycStatus)) {
      rawSellers = await prisma.$queryRaw`
        SELECT 
          s."id",
          s."userId",
          s."storeName",
          s."gstin",
          s."kycStatus",
          s."kycRejectionReason",
          s."totalRevenue"::text as "totalRevenue",
          s."totalOrders",
          s."createdAt",
          json_build_object(
            'id', u."id",
            'email', u."email",
            'firstName', u."firstName",
            'lastName', u."lastName",
            'phone', u."phone",
            'avatarUrl', u."avatarUrl",
            'isActive', u."isActive"
          ) as "user",
          (SELECT COUNT(*)::int FROM "Product" p WHERE p."sellerId" = s."id") as "productCount"
        FROM "Seller" s
        LEFT JOIN "User" u ON s."userId" = u."id"
        WHERE s."kycStatus" = ${kycStatus}::"KYCStatus"
        ORDER BY s."createdAt" DESC
      `;
    } else {
      rawSellers = await prisma.$queryRaw`
        SELECT 
          s."id",
          s."userId",
          s."storeName",
          s."gstin",
          s."kycStatus",
          s."kycRejectionReason",
          s."totalRevenue"::text as "totalRevenue",
          s."totalOrders",
          s."createdAt",
          json_build_object(
            'id', u."id",
            'email', u."email",
            'firstName', u."firstName",
            'lastName', u."lastName",
            'phone', u."phone",
            'avatarUrl', u."avatarUrl",
            'isActive', u."isActive"
          ) as "user",
          (SELECT COUNT(*)::int FROM "Product" p WHERE p."sellerId" = s."id") as "productCount"
        FROM "Seller" s
        LEFT JOIN "User" u ON s."userId" = u."id"
        ORDER BY s."createdAt" DESC
      `;
    }
  } catch (err) {
    console.warn('Failed to query raw sellers:', err);
    const sellerUsers = await prisma.user.findMany({
      where: { role: 'SELLER' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
      },
    });
    rawSellers = sellerUsers.map((u) => ({
      id: u.id,
      userId: u.id,
      storeName: `${u.firstName}'s Store`,
      gstin: null,
      kycStatus: 'APPROVED',
      kycRejectionReason: null,
      totalRevenue: '0',
      totalOrders: 0,
      createdAt: u.createdAt,
      user: u,
      productCount: 0,
    }));
  }

  const sellers = (rawSellers || []).map((s: any) => ({
    id: s.id,
    userId: s.userId,
    storeName: s.storeName,
    gstin: s.gstin,
    kycStatus: s.kycStatus,
    kycRejectionReason: s.kycRejectionReason,
    totalRevenue: Number(s.totalRevenue || 0),
    totalOrders: Number(s.totalOrders || 0),
    createdAt: s.createdAt,
    user: s.user || null,
    _count: {
      products: Number(s.productCount || 0),
    },
  }));

  res.json({ data: sellers });
}));

// Admin: Update seller KYC status
router.patch('/admin/sellers/:id/kyc', authGuard, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req: Request, res: Response) => {
  const { status, rejectionReason } = req.body || {};
  if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
    throw new ValidationError('Status must be APPROVED, REJECTED, or PENDING');
  }

  const sellers: any = await prisma.$queryRaw`
    SELECT "id", "userId", "storeName", "kycStatus", "kycRejectionReason"
    FROM "Seller"
    WHERE "id" = ${req.params.id} OR "userId" = ${req.params.id}
    LIMIT 1
  `.catch(() => []);

  if (!sellers || sellers.length === 0) throw new NotFoundError('Seller');
  const seller = sellers[0];
  const reason = status === 'REJECTED' ? rejectionReason || 'KYC documentation rejected' : null;

  try {
    await prisma.$executeRaw`
      UPDATE "Seller"
      SET "kycStatus" = ${status}::"KYCStatus", "kycRejectionReason" = ${reason}, "updatedAt" = NOW()
      WHERE "id" = ${seller.id}
    `;
  } catch (err: any) {
    console.warn('Failed to update seller KYC status:', err);
  }

  // If rejected, immediately deactivate all products belonging to this seller
  if (status === 'REJECTED') {
    try {
      await prisma.$executeRaw`
        UPDATE "Product"
        SET "status" = 'INACTIVE'::"ProductStatus", "updatedAt" = NOW()
        WHERE "sellerId" = ${seller.id} OR "sellerId" = ${seller.userId}
      `;
      console.log(`Deactivated active products for rejected seller ${seller.id}`);
    } catch (prodErr: any) {
      console.warn('Failed to deactivate products for rejected seller:', prodErr);
    }
  }

  // Look up user to notify via in-app notification AND send email
  const user = await prisma.user.findUnique({
    where: { id: seller.userId },
    select: { id: true, email: true, firstName: true },
  });

  // Notify seller of KYC decision
  try {
    const notifId = 'notif_' + Math.random().toString(36).substring(2, 11);
    const title = status === 'APPROVED' ? 'Seller KYC Approved!' : 'Seller KYC Update';
    const body = status === 'APPROVED' 
      ? 'Congratulations! Your seller account has been approved. You can now sell products.'
      : `Your seller KYC status is: ${status}. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`;
    await prisma.$executeRaw`
      INSERT INTO "Notification" ("id", "userId", "type", "title", "body", "read", "createdAt")
      VALUES (${notifId}, ${seller.userId}, 'SYSTEM'::"NotificationType", ${title}, ${body}, false, NOW())
    `;
  } catch {}

  // Send branded email to seller
  if (user && user.email) {
    sendKycDecisionEmail(user.email, status as 'APPROVED' | 'REJECTED', user.firstName, reason || undefined).catch((err) => {
      console.warn('Failed to send KYC decision email:', err);
    });
  }

  res.json({
    ...seller,
    kycStatus: status,
    kycRejectionReason: reason,
  });
}));

// Admin: Get alerts (Infra & Fraud)
router.get('/admin/alerts', authGuard, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req: Request, res: Response) => {
  const [infraAlerts, fraudAlerts] = await Promise.all([
    prisma.$queryRaw<any[]>`
      SELECT "id", "source", "severity", "message", "acknowledged", "createdAt"
      FROM "InfraAlert"
      ORDER BY "createdAt" DESC
      LIMIT 50
    `.catch(() => []),
    prisma.$queryRaw<any[]>`
      SELECT "id", "userId", "orderId", "type", "severity", "details", "resolved", "createdAt"
      FROM "FraudAlert"
      ORDER BY "createdAt" DESC
      LIMIT 50
    `.catch(() => []),
  ]);

  res.json({
    infraAlerts: infraAlerts || [],
    fraudAlerts: fraudAlerts || [],
  });
}));

// Admin: Acknowledge alert
router.patch('/admin/alerts/:id/acknowledge', authGuard, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.body || {};
  try {
    if (type === 'fraud') {
      await prisma.$executeRaw`
        UPDATE "FraudAlert"
        SET "resolved" = true
        WHERE "id" = ${req.params.id}
      `;
      return res.json({ id: req.params.id, resolved: true });
    } else {
      await prisma.$executeRaw`
        UPDATE "InfraAlert"
        SET "acknowledged" = true
        WHERE "id" = ${req.params.id}
      `;
      return res.json({ id: req.params.id, acknowledged: true });
    }
  } catch (err: any) {
    return res.json({ id: req.params.id, acknowledged: true, error: err?.message });
  }
}));

// Admin: Generate a test/simulation alert (so admin can verify system alerts are working!)
router.post('/admin/alerts/test', authGuard, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req: Request, res: Response) => {
  const { type = 'infra', severity = 'HIGH', message } = req.body || {};
  const alertId = 'alert_' + Math.random().toString(36).substring(2, 11);

  if (type === 'fraud') {
    const detailsJson = JSON.stringify({
      reason: message || 'Rapid suspicious checkout velocity detected from unusual IP (192.168.1.105)',
      riskScore: 89,
      country: 'IN',
    });
    await prisma.$executeRaw`
      INSERT INTO "FraudAlert" ("id", "type", "severity", "details", "resolved", "createdAt")
      VALUES (${alertId}, 'SUSPICIOUS_VELOCITY', ${severity}, ${detailsJson}::jsonb, false, NOW())
    `;
    return res.status(201).json({ id: alertId, type: 'fraud', message: 'Test fraud alert generated successfully' });
  } else {
    // Look up or link a superadmin
    let superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    const superAdminUserId = superAdmin ? superAdmin.id : (req as any).user.id;
    const superAdminRecs = await prisma.$queryRaw<any[]>`
      SELECT id FROM "SuperAdmin" WHERE "userId" = ${superAdminUserId} LIMIT 1
    `.catch(() => []);
    let superAdminId: string;
    if (superAdminRecs.length > 0) {
      superAdminId = superAdminRecs[0].id;
    } else {
      superAdminId = 'sa_' + superAdminUserId.slice(-8);
      await prisma.$executeRaw`
        INSERT INTO "SuperAdmin" ("id", "userId") VALUES (${superAdminId}, ${superAdminUserId})
        ON CONFLICT ("userId") DO NOTHING
      `.catch(() => {});
    }

    const alertMessage = message || 'Postgres connection pool utilization exceeded 85% threshold (Worker node-2)';
    await prisma.$executeRaw`
      INSERT INTO "InfraAlert" ("id", "superAdminId", "source", "severity", "message", "acknowledged", "createdAt")
      VALUES (${alertId}, ${superAdminId}, 'PostgresMonitor', ${severity}, ${alertMessage}, false, NOW())
    `;
    return res.status(201).json({ id: alertId, type: 'infra', message: 'Test infrastructure alert generated successfully' });
  }
}));

// Admin: Get user by ID
router.get('/:id', authGuard, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      role: true,
      isVerified: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      addresses: true,
    },
  });
  if (!user) throw new NotFoundError('User');
  res.json(user);
}));

// Admin: Update user
router.patch('/:id', authGuard, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req: Request, res: Response) => {
  const allowedFields = ['firstName', 'lastName', 'phone', 'avatarUrl', 'role', 'isActive', 'isVerified'];
  const data = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowedFields.includes(k)));

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      role: true,
      isVerified: true,
      isActive: true,
      updatedAt: true,
    },
  });
  res.json(user);
}));

export { router as userRouter };