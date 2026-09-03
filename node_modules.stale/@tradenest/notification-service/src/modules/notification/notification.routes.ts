import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { asyncHandler } from '../../middlewares/errorHandler';
import { NotFoundError, ValidationError } from '@tradenest/common';
import { NotificationType, PaginationQuerySchema } from '@tradenest/common';

const router = Router();
function validate(schema: z.ZodSchema) { return (req: any, res: any, next: any) => { const result = schema.safeParse(req.body); if (!result.success) throw new ValidationError('Invalid request data', result.error.flatten().fieldErrors); req.body = result.data; next(); }; }

// GET /api/notifications - List user notifications
router.get('/', asyncHandler(async (req, res) => {
  const query = PaginationQuerySchema.parse(req.query);
  const userId = req.headers['x-user-id'] as string;
  const { page, limit, sort, order } = query;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({ where: { userId }, orderBy: { [sort || 'createdAt']: order || 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.notification.count({ where: { userId } }),
  ]);

  res.json({ data: notifications, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const count = await prisma.notification.count({ where: { userId, read: false } });
  res.json({ count });
}));

// PATCH /api/notifications/:id/read - Mark as read
router.patch('/:id/read', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const notification = await prisma.notification.findFirst({ where: { id: req.params.id, userId } });
  if (!notification) throw new NotFoundError('Notification');
  const updated = await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
  res.json(updated);
}));

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  res.json({ success: true });
}));

// POST /api/notifications - Create notification (internal)
router.post('/', validate(z.object({ userId: z.string(), type: z.nativeEnum(NotificationType), title: z.string(), body: z.string(), data: z.record(z.any()).optional() })), asyncHandler(async (req, res) => {
  const notification = await prisma.notification.create({ data: req.body });
  // TODO: Emit via WebSocket
  res.status(201).json(notification);
}));

export { router as notificationRouter };