import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { authGuard, requireRoles, AuthenticatedRequest } from '../../guards/authGuard';
import { asyncHandler } from '../../middlewares/errorHandler';
import { NotFoundError, ValidationError } from '@tradenest/common';
import { UpdateProfileDtoSchema, ChangePasswordDtoSchema, CreateAddressDtoSchema, UpdateAddressDtoSchema } from '@tradenest/common';
import bcrypt from 'bcryptjs';
import { UserRole } from '@tradenest/common';

const router = Router();

// Validation middleware
function validate(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError('Invalid request data', result.error.flatten().fieldErrors);
    }
    req.body = result.data;
    next();
  };
}

// Get current user profile
router.get('/profile', authGuard, asyncHandler(async (req: AuthenticatedRequest, res) => {
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
  res.json(user);
}));

// Update profile
router.patch('/profile', authGuard, validate(UpdateProfileDtoSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
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
router.post('/change-password', authGuard, validate(ChangePasswordDtoSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new NotFoundError('User');

  const isValid = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
  if (!isValid) throw new ValidationError('Current password is incorrect');

  const passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });

  res.json({ message: 'Password changed successfully' });
}));

// Addresses
router.get('/addresses', authGuard, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user.id },
    orderBy: { isDefault: 'desc' },
  });
  res.json(addresses);
}));

router.post('/addresses', authGuard, validate(CreateAddressDtoSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
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

router.patch('/addresses/:id', authGuard, validate(UpdateAddressDtoSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
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

router.delete('/addresses/:id', authGuard, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const address = await prisma.address.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!address) throw new NotFoundError('Address');

  await prisma.address.delete({ where: { id: req.params.id } });
  res.json({ message: 'Address deleted' });
}));

// Admin: Get all users
router.get('/', authGuard, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req, res) => {
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

// Admin: Get user by ID
router.get('/:id', authGuard, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req, res) => {
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
router.patch('/:id', authGuard, requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN), asyncHandler(async (req, res) => {
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