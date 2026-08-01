import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { asyncHandler } from '../../middlewares/errorHandler';
import { NotFoundError, ValidationError } from '@tradenest/common';
import { OrderQuerySchema, CreateOrderDtoSchema, OrderStatus } from '@tradenest/common';

const router = Router();

function validate(schema: z.ZodSchema) { return (req: any, res: any, next: any) => { const result = schema.safeParse(req.body); if (!result.success) throw new ValidationError('Invalid request data', result.error.flatten().fieldErrors); req.body = result.data; next(); }; }

// GET /api/orders - List user orders
router.get('/', asyncHandler(async (req, res) => {
  const query = OrderQuerySchema.parse(req.query);
  const { page, limit, sort, order, status, startDate, endDate } = query;
  const userId = req.headers['x-user-id'] as string; // From auth gateway

  const where: any = { userId };
  if (status) where.status = status;
  if (startDate || endDate) where.createdAt = { ...(startDate && { gte: new Date(startDate) }), ...(endDate && { lte: new Date(endDate) }) };

  const orderBy: any = sort ? { [sort]: order } : { createdAt: 'desc' };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, include: { items: true, payment: true, invoice: true }, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.order.count({ where }),
  ]);

  res.json({ data: orders, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

// GET /api/orders/:id - Get order detail
router.get('/:id', asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true, payment: true, invoice: true, returns: true } });
  if (!order) throw new NotFoundError('Order');
  res.json(order);
}));

// POST /api/orders - Create order
router.post('/', asyncHandler(async (req, res) => {
  const data = CreateOrderDtoSchema.parse(req.body);
  const userId = req.headers['x-user-id'] as string;

  // In real implementation: fetch cart, validate inventory, calculate totals, create order
  const order = await prisma.order.create({
    data: {
      userId,
      status: OrderStatus.PENDING,
      subtotal: 0, tax: 0, shipping: 0, discount: 0, total: 0,
      shippingAddress: {}, billingAddress: {},
      items: { create: [] },
    },
  });
  res.status(201).json(order);
}));

// PATCH /api/orders/:id/status - Update order status (seller/admin)
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!Object.values(OrderStatus).includes(status)) throw new ValidationError('Invalid status');
  const order = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
  res.json(order);
}));

export { router as orderRouter };