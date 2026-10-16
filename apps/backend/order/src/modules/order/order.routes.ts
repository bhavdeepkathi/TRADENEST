import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { asyncHandler } from '../../middlewares/errorHandler';
import { NotFoundError, ValidationError } from '@tradenest/common';
import { OrderQuerySchema, CreateOrderDtoSchema, OrderStatus, PaymentProvider, PaymentStatus } from '@tradenest/common';

const router = Router();

function validate(schema: z.ZodSchema) { return (req: any, res: any, next: any) => { const result = schema.safeParse(req.body); if (!result.success) throw new ValidationError('Invalid request data', result.error.flatten().fieldErrors); req.body = result.data; next(); }; }

// GET /api/orders - List user orders
router.get('/', asyncHandler(async (req, res) => {
  const query = OrderQuerySchema.parse(req.query);
  const { page, limit, sort, order, status, startDate, endDate } = query;
  const userId = req.headers['x-user-id'] as string;

  const where: any = { userId };
  if (status) where.status = status;
  if (startDate || endDate) where.createdAt = { ...(startDate && { gte: new Date(startDate) }), ...(endDate && { lte: new Date(endDate) }) };

  const orderBy: any = sort ? { [sort]: order } : { createdAt: 'desc' };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, include: { items: { include: { product: true } }, payment: true, invoice: true }, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.order.count({ where }),
  ]);

  res.json({ data: orders, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

// GET /api/orders/:id - Get order detail
router.get('/:id', asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: { include: { product: true } }, payment: true, invoice: true, returns: true } });
  if (!order) throw new NotFoundError('Order');
  
  // Verify ownership
  const userId = req.headers['x-user-id'] as string;
  if (order.userId !== userId) {
    throw new ValidationError('Unauthorized access to order');
  }
  
  res.json(order);
}));

// POST /api/orders - Create order from cart
router.post('/', asyncHandler(async (req, res) => {
  const data = CreateOrderDtoSchema.parse(req.body);
  const userId = req.headers['x-user-id'] as string;

  const order = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                inventory: true,
                category: true,
                seller: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new ValidationError('Cart is empty');
    }

    let subtotal = 0;
    const orderItems = [];

    for (const cartItem of cart.items) {
      const product = cartItem.product;

      if (product.status !== 'ACTIVE') {
        throw new ValidationError(`Product "${product.title}" is no longer available`);
      }

      if (!product.inventory) {
        throw new ValidationError(`Insufficient stock for "${product.title}"`);
      }

      const pendingReservations = await tx.orderItem.aggregate({
        where: { productId: product.id, order: { status: OrderStatus.PENDING } },
        _sum: { quantity: true },
      });
      const reserved = pendingReservations._sum.quantity ?? 0;
      if (product.inventory.reserved !== reserved) {
        await tx.inventory.update({
          where: { productId: product.id },
          data: { reserved },
        });
      }
      if (product.inventory.quantity - reserved < cartItem.quantity) {
        throw new ValidationError(`Insufficient stock for "${product.title}"`);
      }

      const itemSubtotal = Number(product.price) * cartItem.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.id,
        sellerId: product.sellerId,
        title: product.title,
        price: product.price,
        quantity: cartItem.quantity,
        discount: 0,
      });

      await tx.inventory.update({
        where: { productId: product.id },
        data: { reserved: { increment: cartItem.quantity } },
      });
    }

    const shipping = subtotal > 499 ? 0 : 99;
    const tax = 0;
    const total = subtotal + shipping + tax;
    let discount = 0;
    let couponCode = null;

    if (data.couponCode) {
      const coupon = await tx.coupon.findUnique({
        where: { code: data.couponCode },
        include: { usages: { where: { userId } } },
      });

      if (coupon && coupon.isActive && new Date() >= coupon.startAt && new Date() <= coupon.endAt) {
        if (!coupon.usages.some(u => u.userId === userId) || coupon.usageLimit > coupon.usedCount) {
          if (Number(coupon.minOrder || 0) <= subtotal) {
            if (coupon.type === 'PERCENT') {
              discount = Math.min(Math.round(subtotal * Number(coupon.value) / 100), Number(coupon.maxDiscount || 999999));
            } else {
              discount = Math.min(Number(coupon.value), subtotal);
            }
            couponCode = coupon.code;
          }
        }
      }
    }

    const finalTotal = total - discount;

    const shippingAddress = { ...data.shippingAddress };
    const billingAddress = { ...shippingAddress };

    return tx.order.create({
      data: {
        userId,
        status: OrderStatus.PENDING,
        subtotal,
        tax,
        shipping,
        discount,
        total: finalTotal,
        couponCode,
        shippingAddress,
        billingAddress,
        items: { create: orderItems },
      },
      include: {
        items: { include: { product: true } },
        payment: true,
      },
    });
  });

  res.status(201).json(order);
}));

// POST /api/orders/:id/confirm-payment - Confirm payment and update order status
router.post('/:id/confirm-payment', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { paymentId, provider } = req.body;

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: req.params.id },
      include: { items: true, payment: true },
    });

    if (!order) throw new NotFoundError('Order');
    if (order.userId !== userId) throw new ValidationError('Unauthorized');
    if (!order.payment || order.payment.status !== PaymentStatus.SUCCESS) {
      throw new ValidationError('Payment has not been verified');
    }
    if (
      (order.payment.provider === PaymentProvider.RAZORPAY || order.payment.provider === PaymentProvider.UPI) &&
      (
        !order.payment.rawResponse ||
        typeof order.payment.rawResponse !== 'object' ||
        Array.isArray(order.payment.rawResponse) ||
        !('razorpayPaymentId' in order.payment.rawResponse) ||
        !('razorpaySignature' in order.payment.rawResponse)
      )
    ) {
      throw new ValidationError('Payment has not been verified');
    }
    if (paymentId && paymentId !== order.payment.id) {
      throw new ValidationError('Payment does not match order');
    }
    if (provider && provider !== order.payment.provider) {
      throw new ValidationError('Payment provider does not match order');
    }
    if (order.status === OrderStatus.CONFIRMED) return order;
    if (order.status !== OrderStatus.PENDING) {
      throw new ValidationError('Order cannot be confirmed in its current state');
    }

    const claimed = await tx.order.updateMany({
      where: { id: order.id, status: OrderStatus.PENDING },
      data: { status: OrderStatus.CONFIRMED },
    });
    if (claimed.count !== 1) {
      const currentOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: { items: { include: { product: true } }, payment: true },
      });
      if (currentOrder?.status === OrderStatus.CONFIRMED) return currentOrder;
      throw new ValidationError('Order could not be confirmed');
    }

    for (const item of order.items) {
      await tx.inventory.update({
        where: { productId: item.productId },
        data: {
          quantity: { decrement: item.quantity },
          reserved: { decrement: item.quantity },
        },
      });
    }

    const cart = await tx.cart.findUnique({ where: { userId } });
    if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return tx.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: { include: { product: true } }, payment: true },
    });
  });

  res.json(updatedOrder);
}));

// PATCH /api/orders/:id/status - Update order status (seller/admin)
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!Object.values(OrderStatus).includes(status)) throw new ValidationError('Invalid status');
  const order = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
  res.json(order);
}));

export { router as orderRouter };