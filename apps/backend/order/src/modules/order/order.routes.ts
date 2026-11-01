import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { asyncHandler } from '../../middlewares/errorHandler';
import { NotFoundError, ValidationError, generateInvoiceNumber } from '@tradenest/common';
import { OrderQuerySchema, CreateOrderDtoSchema, OrderStatus, PaymentProvider, PaymentStatus } from '@tradenest/common';
import { generateInvoicePdf } from './invoice.service';
import { sendOrderPlacedEmail, sendPaymentConfirmedEmail, sendOrderStatusEmail, sendNewOrderReceivedSellerEmail, sendReturnRequestSellerEmail, sendReturnDecisionCustomerEmail } from '../../utils/orderMailer';

const router = Router();

function validate(schema: z.ZodSchema) { return (req: any, res: any, next: any) => { const result = schema.safeParse(req.body); if (!result.success) throw new ValidationError('Invalid request data', result.error.flatten().fieldErrors); req.body = result.data; next(); }; }

async function resolveSellerIds(sellerIdOrUserId: string): Promise<string[]> {
  const seller = await prisma.seller.findFirst({
    where: {
      OR: [
        { id: sellerIdOrUserId },
        { userId: sellerIdOrUserId },
      ],
    },
  });
  if (seller) {
    return Array.from(new Set([seller.id, seller.userId, sellerIdOrUserId]));
  }
  return [sellerIdOrUserId];
}

async function createInAppNotification(userId: string, type: string, title: string, body: string, data?: any) {
  try {
    const notifId = 'notif_' + Math.random().toString(36).substring(2, 11);
    const dataJson = JSON.stringify(data || {});
    await prisma.$executeRaw`
      INSERT INTO "Notification" ("id", "userId", "type", "title", "body", "data", "read", "createdAt")
      VALUES (${notifId}, ${userId}, ${type}::"NotificationType", ${title}, ${body}, ${dataJson}::jsonb, false, NOW())
    `;
  } catch (err) {
    console.warn('Failed to insert notification:', err);
  }
}

async function findUserForEmail(userId: string): Promise<{ email: string; firstName: string; lastName?: string } | null> {
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT "email", "firstName", "lastName" FROM "User" WHERE "id" = ${userId} LIMIT 1
    `;
    return rows?.[0] || null;
  } catch (err) {
    console.warn('Failed to find user for email:', err);
    return null;
  }
}

// GET /api/orders - List user orders
router.get('/', asyncHandler(async (req, res) => {
  const query = OrderQuerySchema.parse(req.query);
  const { page, limit, sort, order, status, startDate, endDate } = query;
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    throw new ValidationError('User ID not found in request');
  }

  const where: any = { userId };
  if (status) where.status = status;
  if (startDate || endDate) where.createdAt = { ...(startDate && { gte: new Date(startDate) }), ...(endDate && { lte: new Date(endDate) }) };

  const orderBy: any = sort ? { [sort]: order } : { createdAt: 'desc' };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, include: { items: { include: { product: true } }, payment: true, invoice: true, returns: true }, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.order.count({ where }),
  ]);

  const formattedOrders = orders.map((o: any) => ({
    id: o.id,
    userId: o.userId,
    status: o.status,
    subtotal: Number(o.subtotal),
    tax: Number(o.tax),
    shipping: Number(o.shipping),
    discount: Number(o.discount),
    total: Number(o.total),
    couponCode: o.couponCode,
    shippingAddress: o.shippingAddress,
    billingAddress: o.billingAddress,
    items: (o.items || []).map((item: any) => ({
      id: item.id,
      productId: item.productId,
      sellerId: item.sellerId,
      title: item.title,
      price: Number(item.price),
      quantity: item.quantity,
      discount: Number(item.discount),
      product: item.product,
    })),
    payment: o.payment ? {
      id: o.payment.id,
      provider: o.payment.provider,
      status: o.payment.status,
      amount: Number(o.payment.amount),
      providerRef: o.payment.providerRef,
    } : null,
    invoice: o.invoice ? {
      id: o.invoice.id,
      number: o.invoice.number,
      pdfUrl: `/api/orders/${o.id}/invoice`,
    } : (o.status !== OrderStatus.PENDING ? {
      id: `inv-${o.id}`,
      number: `INV-${o.id.slice(-6).toUpperCase()}`,
      pdfUrl: `/api/orders/${o.id}/invoice`,
    } : null),
    returns: o.returns || [],
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }));

  res.json({ data: formattedOrders, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

// GET /api/orders/:id - Get order detail
router.get('/:id', asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: { include: { product: true } }, payment: true, invoice: true, returns: true } });
  if (!order) throw new NotFoundError('Order');
  
  // Verify ownership
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as string;
  if (!userId) {
    throw new ValidationError('User ID not found in request');
  }

  const sellerIds = await resolveSellerIds(userId);
  const isSellerOfItem = order.items.some((item: any) => sellerIds.includes(item.sellerId));
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  if (order.userId !== userId && !isSellerOfItem && !isAdmin) {
    throw new ValidationError('Unauthorized access to order');
  }
  
  let invoice = order.invoice;
  if (!invoice && order.status !== OrderStatus.PENDING) {
    try {
      invoice = await prisma.invoice.create({
        data: {
          orderId: order.id,
          number: generateInvoiceNumber(),
          pdfKey: `/api/orders/${order.id}/invoice`,
        },
      });
    } catch {
      invoice = await prisma.invoice.findUnique({ where: { orderId: order.id } });
    }
  }

  const formattedOrder = {
    ...order,
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    shipping: Number(order.shipping),
    discount: Number(order.discount),
    total: Number(order.total),
    payment: order.payment ? {
      ...order.payment,
      amount: Number(order.payment.amount),
    } : null,
    invoice: invoice ? {
      id: invoice.id,
      number: invoice.number,
      pdfUrl: `/api/orders/${order.id}/invoice`,
    } : null,
    returns: order.returns || [],
    items: (order.items || []).map((item: any) => ({
      ...item,
      price: Number(item.price),
      discount: Number(item.discount),
    })),
  };

  res.json(formattedOrder);
}));

// GET /api/orders/:id/invoice - Download invoice PDF
router.get('/:id/invoice', asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: { include: { product: true } },
      payment: true,
      invoice: true,
    },
  });
  if (!order) throw new NotFoundError('Order');

  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as string;
  if (!userId) {
    throw new ValidationError('User ID not found in request');
  }

  const sellerIds = await resolveSellerIds(userId);
  const isSellerOfItem = order.items.some((item: any) => sellerIds.includes(item.sellerId));
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  if (order.userId !== userId && !isSellerOfItem && !isAdmin) {
    throw new ValidationError('Unauthorized access to order invoice');
  }

  let invoice = order.invoice;
  if (!invoice) {
    try {
      invoice = await prisma.invoice.create({
        data: {
          orderId: order.id,
          number: generateInvoiceNumber(),
          pdfKey: `/api/orders/${order.id}/invoice`,
        },
      });
    } catch {
      invoice = await prisma.invoice.findUnique({ where: { orderId: order.id } });
    }
  }

  if (!invoice) {
    throw new ValidationError('Could not generate invoice record');
  }

  const pdfBuffer = await generateInvoicePdf(order, invoice);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.number}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  res.end(pdfBuffer);
}));

// POST /api/orders/:id/return - Request return for delivered order
router.post('/:id/return', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    throw new ValidationError('User ID not found in request');
  }

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, returns: true },
  });
  if (!order) throw new NotFoundError('Order');

  if (order.userId !== userId) {
    throw new ValidationError('Unauthorized to return this order');
  }

  if (order.status !== OrderStatus.DELIVERED) {
    throw new ValidationError('Only delivered orders can be returned');
  }

  const activeReturn = order.returns?.find((r: any) => r.status === 'PENDING' || r.status === 'APPROVED');
  if (activeReturn) {
    throw new ValidationError('A return request has already been submitted for this order');
  }

  const { reason, images } = req.body || {};
  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    throw new ValidationError('Please provide a reason for the return (at least 5 characters)');
  }

  const returnRequest = await prisma.returnRequest.create({
    data: {
      orderId: order.id,
      userId,
      sellerId: order.items[0]?.sellerId || '',
      reason: reason.trim(),
      status: 'PENDING',
    },
  });

  // Notify all sellers involved in this order with in-app notification & email
  const distinctSellerIds = Array.from(new Set(order.items.map((i: any) => i.sellerId).filter(Boolean)));
  for (const sId of distinctSellerIds) {
    try {
      const seller = await prisma.seller.findFirst({
        where: { OR: [{ id: sId }, { userId: sId }] },
      });
      const notifyUserId = seller?.userId || sId;
      await createInAppNotification(
        notifyUserId,
        'ORDER',
        'Customer Return Request Received',
        `A customer submitted a return request for Order #${order.id.slice(0, 8)}. Reason: ${reason.trim()}`,
        { orderId: order.id, returnId: returnRequest.id }
      );

      const sellerUser = await findUserForEmail(notifyUserId);
      if (sellerUser) {
        const itemTitles = order.items.filter((i: any) => i.sellerId === sId).map((i: any) => i.title);
        sendReturnRequestSellerEmail(
          order,
          { email: sellerUser.email, firstName: sellerUser.firstName, storeName: seller?.storeName },
          reason.trim(),
          itemTitles
        ).catch((err: any) => console.warn('Failed to send return request email to seller:', err));
      }
    } catch (notifErr) {
      console.warn('Error sending seller return notifications:', notifErr);
    }
  }

  res.status(201).json(returnRequest);
}));

// POST /api/orders/:id/cancel - Customer or Admin cancels order before dispatch
router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as string;
  if (!userId) {
    throw new ValidationError('User ID not found in request');
  }

  const { reason } = req.body || {};
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, payment: true, shipment: true },
  });
  if (!order) throw new NotFoundError('Order');

  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  if (order.userId !== userId && !isAdmin) {
    throw new ValidationError('Unauthorized to cancel this order');
  }

  if (order.status === OrderStatus.CANCELLED) {
    throw new ValidationError('Order is already cancelled');
  }

  if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
    throw new ValidationError('Order is already in transit or delivered. Please request a return instead.');
  }

  const cancelReason = (typeof reason === 'string' && reason.trim()) ? reason.trim() : 'Cancelled by customer';

  // 1. Update order status
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: { status: OrderStatus.CANCELLED },
  });

  // 2. Restock inventory
  for (const item of order.items) {
    await prisma.inventory.updateMany({
      where: { productId: item.productId },
      data: { quantity: { increment: item.quantity } },
    }).catch((err: any) => console.warn('Failed to restock item:', err));
  }

  // 3. Update shipment if exists
  if (order.shipment) {
    await prisma.shipment.update({
      where: { id: order.shipment.id },
      data: { status: 'CANCELLED' },
    }).catch((err: any) => console.warn('Failed to cancel shipment:', err));
  }

  // 4. Auto-refund to Wallet if payment was SUCCESS
  let refundedToWallet = false;
  if (order.payment && order.payment.status === PaymentStatus.SUCCESS) {
    const refundAmount = Number(order.total);
    const wallet = await prisma.wallet.upsert({
      where: { userId: order.userId },
      create: { userId: order.userId, balance: refundAmount },
      update: { balance: { increment: refundAmount } },
    });

    await prisma.walletTxn.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        amount: refundAmount,
        description: `Refund for cancelled order #${order.id.slice(0, 8)}`,
        reference: order.id,
      },
    });

    await prisma.payment.update({
      where: { id: order.payment.id },
      data: { status: PaymentStatus.REFUNDED },
    });

    await prisma.refund.create({
      data: {
        paymentId: order.payment.id,
        amount: refundAmount,
        reason: cancelReason,
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    }).catch(() => {});

    refundedToWallet = true;
  }

  // 5. In-app notifications
  await createInAppNotification(
    order.userId,
    'ORDER',
    'Order Cancelled',
    `Your order #${order.id.slice(0, 8)} was cancelled successfully.${refundedToWallet ? ' ₹' + Number(order.total).toLocaleString('en-IN') + ' has been credited to your TRADENEST Wallet.' : ''}`,
    { orderId: order.id }
  );

  // 6. Email notification
  const user = await findUserForEmail(order.userId);
  if (user) {
    sendOrderStatusEmail(order, user, OrderStatus.CANCELLED).catch((err: any) =>
      console.warn('Failed to send cancellation email:', err)
    );
  }

  res.json({
    success: true,
    message: refundedToWallet
      ? 'Order cancelled successfully. Full refund has been credited to your TRADENEST Wallet.'
      : 'Order cancelled successfully.',
    order: updatedOrder,
    refundedToWallet,
  });
}));

// POST /api/orders - Create order from cart
router.post('/', asyncHandler(async (req, res) => {
  const data = CreateOrderDtoSchema.parse(req.body);
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    throw new ValidationError('User ID not found in request');
  }

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

      if (product.status !== 'ACTIVE' || (product.seller as any)?.kycStatus === 'REJECTED') {
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
    const isReseller = Boolean((req.body as any).isReseller);
    const customerBillAmount = (req.body as any).customerBillAmount ? Number((req.body as any).customerBillAmount) : finalTotal;
    const resellerMargin = isReseller ? Math.max(0, customerBillAmount - finalTotal) : 0;
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

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
        isResellerOrder: isReseller,
        resellerUserId: isReseller ? userId : null,
        customerBillAmount,
        resellerMargin,
        deliveryOtp,
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

  // Auto-create persistent Shipment record for Logistics Fleet
  try {
    const shortOrderNumber = `TN-ORD-${order.id.slice(0, 8).toUpperCase()}`;
    const shipAddr = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : (order.shippingAddress || {});
    const custName = shipAddr.fullName || shipAddr.name || 'Customer';
    const custPhone = shipAddr.phone || '+91 98201 44892';
    const fullAddr = `${shipAddr.line1 || shipAddr.addressLine1 || ''} ${shipAddr.line2 || shipAddr.addressLine2 || ''}, ${shipAddr.city || 'Mumbai'}, ${shipAddr.state || 'MH'}`.trim();
    await prisma.shipment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        orderNumber: shortOrderNumber,
        customerName: custName,
        customerPhone: custPhone,
        deliveryAddress: fullAddr || 'Mumbai Central',
        city: shipAddr.city || 'Mumbai',
        pincode: shipAddr.postalCode || '400001',
        distance: `${(1.2 + Math.random() * 3.5).toFixed(1)} km`,
        status: 'PENDING_PICKUP',
        itemsCount: order.items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0),
        totalWeight: `${Math.max(0.5, order.items.length * 0.6).toFixed(1)} kg`,
        isReseller: order.isResellerOrder,
        customerBillAmount: order.customerBillAmount || order.total,
        platformBaseCost: order.total,
        deliveryOtp: order.deliveryOtp || '4821',
      },
      update: {},
    });
  } catch (shipErr) {
    console.warn('Failed to auto-create shipment:', shipErr);
  }

  // 1. Notify Customer in-app
  await createInAppNotification(
    userId,
    'ORDER',
    'Order Placed Successfully',
    `Your order #${order.id.slice(0, 8)} for ₹${Number(order.total)} has been placed. Awaiting seller approval.`,
    { orderId: order.id }
  );

  // 2. Notify each distinct Seller about the new order needing approval
  try {
    const sellerIds = Array.from(new Set(order.items.map((i: any) => i.sellerId)));
    for (const sId of sellerIds) {
      const sellerRecord = await prisma.seller.findFirst({
        where: { OR: [{ id: sId }, { userId: sId }] },
        select: { id: true, userId: true, storeName: true },
      });
      const targetSellerUserId = sellerRecord?.userId || sId;
      if (targetSellerUserId) {
        await createInAppNotification(
          targetSellerUserId,
          'ORDER',
          'New Order Received - Approval Required',
          `You received new order #${order.id.slice(0, 8)} (${order.items.length} item(s), ₹${Number(order.total)}). Please review and approve.`,
          { orderId: order.id, customerId: userId, type: 'NEW_ORDER' }
        );

        const sellerUser = await findUserForEmail(targetSellerUserId);
        if (sellerUser && sellerUser.email) {
          const sellerItems = order.items.filter((i: any) => i.sellerId === sId);
          sendNewOrderReceivedSellerEmail(order, { email: sellerUser.email, firstName: sellerUser.firstName, storeName: sellerRecord?.storeName }, sellerItems).catch((err) => {
            console.warn('Failed to send seller new order email:', err);
          });
        }
      }
    }
  } catch (sellerNotifErr) {
    console.warn('Failed to notify seller of new order:', sellerNotifErr);
  }

  // 3. Dispatch purchase confirmation email to Customer
  const customer = await findUserForEmail(userId);
  if (customer && customer.email) {
    sendOrderPlacedEmail(order, customer).catch((err) => {
      console.warn('Failed to send order placed email:', err);
    });
  }

  res.status(201).json(order);
}));

// POST /api/orders/:id/confirm-payment - Confirm payment and update order status
router.post('/:id/confirm-payment', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    throw new ValidationError('User ID not found in request');
  }

  const { paymentId, provider } = req.body;

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: req.params.id },
      include: { items: true, payment: true },
    });

    if (!order) throw new NotFoundError('Order');
    if (order.userId !== userId) throw new ValidationError('Unauthorized');
    if (!order.payment) {
      throw new ValidationError('Payment record not found');
    }
    if (order.payment.provider !== PaymentProvider.COD && order.payment.status !== PaymentStatus.SUCCESS) {
      throw new ValidationError('Payment has not been verified');
    }
    if (order.payment.provider === PaymentProvider.STRIPE) {
      throw new ValidationError('Stripe payments are not currently supported');
    }
    const paymentResponse = order.payment.rawResponse;
    const razorpayVerified =
      paymentResponse !== null &&
      typeof paymentResponse === 'object' &&
      !Array.isArray(paymentResponse) &&
      'razorpayPaymentId' in paymentResponse &&
      (('razorpaySignature' in paymentResponse && typeof paymentResponse.razorpaySignature === 'string') ||
        ('razorpayWebhookVerified' in paymentResponse && paymentResponse.razorpayWebhookVerified === true));
    const upiVerified =
      order.payment.provider === PaymentProvider.UPI &&
      (razorpayVerified || order.payment.status === PaymentStatus.SUCCESS);

    if (order.payment.provider === PaymentProvider.RAZORPAY && !razorpayVerified) {
      throw new ValidationError('Payment has not been verified');
    }
    if (order.payment.provider === PaymentProvider.UPI && !upiVerified) {
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

  // 1. Notify customer in-app about confirmed payment
  const isCod = updatedOrder.payment?.provider === PaymentProvider.COD;
  const notifTitle = isCod ? 'Order Confirmed (Cash on Delivery)' : 'Payment Confirmed';
  const notifBody = isCod
    ? `Your Cash on Delivery order #${updatedOrder.id.slice(0, 8)} for ₹${Number(updatedOrder.total)} has been confirmed! Please keep cash ready upon doorstep delivery.`
    : `Payment of ₹${Number(updatedOrder.total)} for order #${updatedOrder.id.slice(0, 8)} was successful.`;

  await createInAppNotification(
    userId,
    'PAYMENT',
    notifTitle,
    notifBody,
    { orderId: updatedOrder.id, paymentId: updatedOrder.payment?.id, isCod }
  );

  // 2. Notify sellers of items in this order about confirmed payment
  try {
    const sellerIds = Array.from(new Set(updatedOrder.items.map((i: any) => i.sellerId)));
    for (const sId of sellerIds) {
      const sellerRecord = await prisma.seller.findFirst({
        where: { OR: [{ id: sId }, { userId: sId }] },
        select: { userId: true },
      });
      const targetSellerUserId = sellerRecord?.userId || sId;
      if (targetSellerUserId) {
        await createInAppNotification(
          targetSellerUserId,
          'ORDER',
          'Payment Received for Order',
          `Payment for order #${updatedOrder.id.slice(0, 8)} (₹${Number(updatedOrder.total)}) has been confirmed. Please approve and ship.`,
          { orderId: updatedOrder.id, type: 'PAYMENT_CONFIRMED' }
        );
      }
    }
  } catch (err) {
    console.warn('Failed to notify seller of payment:', err);
  }

  // 3. Send email to customer for payment confirmation
  const customer = await findUserForEmail(userId);
  if (customer && customer.email) {
    sendPaymentConfirmedEmail(updatedOrder, customer, updatedOrder.payment).catch((err) => {
      console.warn('Failed to send payment confirmed email:', err);
    });
  }

  res.json(updatedOrder);
}));

// POST /api/orders/coupons/validate - Validate a coupon code for checkout
router.post('/coupons/validate', asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body || {};
  if (!code || typeof code !== 'string') {
    throw new ValidationError('Coupon code is required');
  }

  const cleanCode = code.trim().toUpperCase();
  const numSubtotal = Number(subtotal) || 0;

  const coupon = await prisma.coupon.findUnique({
    where: { code: cleanCode },
  });

  if (!coupon || !coupon.isActive) {
    throw new ValidationError('Invalid or inactive coupon code');
  }

  const now = new Date();
  if (now < coupon.startAt || now > coupon.endAt) {
    throw new ValidationError('Coupon is expired or not yet active');
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new ValidationError('Coupon usage limit reached');
  }

  if (coupon.minOrder && numSubtotal < Number(coupon.minOrder)) {
    throw new ValidationError(`Minimum order value of ₹${Number(coupon.minOrder)} required`);
  }

  let discount = 0;
  if (coupon.type === 'PERCENT') {
    discount = Math.round((numSubtotal * Number(coupon.value)) / 100);
    if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
      discount = Number(coupon.maxDiscount);
    }
  } else {
    discount = Math.min(Number(coupon.value), numSubtotal);
  }

  res.json({
    valid: true,
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    value: Number(coupon.value),
    discount,
  });
}));

// GET /api/orders/coupons - List active coupons
router.get('/coupons', asyncHandler(async (req, res) => {
  const coupons = await prisma.coupon.findMany({
    orderBy: { startAt: 'desc' },
    take: 50,
  });
  res.json(coupons);
}));

// POST /api/orders/coupons - Create coupon
router.post('/coupons', asyncHandler(async (req, res) => {
  const { code, description, type, value, minOrder, maxDiscount, startAt, endAt, usageLimit } = req.body || {};
  if (!code || !type || value === undefined) {
    throw new ValidationError('Missing required coupon fields (code, type, value)');
  }
  const coupon = await prisma.coupon.create({
    data: {
      code: String(code).trim().toUpperCase(),
      description: description || 'Special Discount',
      type: type === 'PERCENT' ? 'PERCENT' : 'FLAT',
      value: Number(value),
      minOrder: minOrder ? Number(minOrder) : null,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      startAt: startAt ? new Date(startAt) : new Date(),
      endAt: endAt ? new Date(endAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: usageLimit ? Number(usageLimit) : 100,
      isActive: true,
    },
  });
  res.status(201).json(coupon);
}));

// GET /api/orders/seller/:sellerId/analytics - Analytics and metrics for seller dashboard
router.get('/seller/:sellerId/analytics', asyncHandler(async (req, res) => {
  let rawSellerId = req.params.sellerId;
  if (rawSellerId === 'me') {
    rawSellerId = req.headers['x-user-id'] as string;
  }
  if (!rawSellerId) {
    throw new ValidationError('Seller ID not found in request');
  }

  const sellerIds = await resolveSellerIds(rawSellerId);
  const period = (req.query.period as string) || '30d';
  const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;

  // 1. Total products listed
  const totalProducts = await prisma.product.count({
    where: { sellerId: { in: sellerIds } },
  });

  // 2. Fetch all order items for this seller
  const allOrderItems = await prisma.orderItem.findMany({
    where: { sellerId: { in: sellerIds } },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          userId: true,
        },
      },
      product: {
        select: {
          id: true,
          title: true,
          price: true,
          images: true,
        },
      },
    },
  });

  // Unique orders
  const uniqueOrderMap = new Map<string, any>();
  let totalRevenue = 0;
  const statusCounts: Record<string, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    PROCESSING: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
    RETURNED: 0,
  };

  const productSalesMap = new Map<string, { id: string; title: string; price: number; sales: number; revenue: number }>();

  // Daily time series buckets
  const dailyBuckets = new Map<string, { date: string; revenue: number; orders: Set<string> }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dailyBuckets.set(key, { date: key, revenue: 0, orders: new Set() });
  }

  for (const item of (allOrderItems as any[])) {
    const itemRev = Number(item.price) * item.quantity - Number(item.discount || 0);
    totalRevenue += itemRev;

    if (!uniqueOrderMap.has(item.orderId)) {
      uniqueOrderMap.set(item.orderId, item.order);
      const st = (item.order.status as string) || 'PENDING';
      if (statusCounts[st] !== undefined) statusCounts[st]++;
      else statusCounts[st] = 1;
    }

    // Top products
    const prod = productSalesMap.get(item.productId) || {
      id: item.productId,
      title: item.title,
      price: Number(item.price),
      sales: 0,
      revenue: 0,
    };
    prod.sales += item.quantity;
    prod.revenue += itemRev;
    productSalesMap.set(item.productId, prod);

    // Daily bucket
    const itemDate = new Date(item.order.createdAt).toISOString().split('T')[0];
    if (dailyBuckets.has(itemDate)) {
      const bucket = dailyBuckets.get(itemDate)!;
      bucket.revenue += itemRev;
      bucket.orders.add(item.orderId);
    }
  }

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const timeSeries = Array.from(dailyBuckets.values()).map(b => ({
    date: b.date,
    revenue: Math.round(b.revenue * 100) / 100,
    orders: b.orders.size,
  }));

  const totalOrders = uniqueOrderMap.size;
  const avgOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;

  res.json({
    period,
    totalProducts,
    totalOrders,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    avgOrderValue,
    statusCounts,
    topProducts,
    timeSeries,
  });
}));

// PATCH /api/orders/:id/status - Update order status (seller/admin)
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!Object.values(OrderStatus).includes(status)) throw new ValidationError('Invalid status');
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status },
    include: { items: true },
  });
  
  // Custom friendly title & body based on status
  let title = `Order Status: ${status}`;
  let body = `Your order #${order.id.slice(0, 8)} status has been updated to ${status}.`;
  if (status === 'CONFIRMED') {
    title = 'Order Approved by Seller!';
    body = `Great news! Your order #${order.id.slice(0, 8)} has been approved by the seller and is now being processed.`;
  } else if (status === 'SHIPPED') {
    title = 'Order Shipped!';
    body = `Your order #${order.id.slice(0, 8)} has been shipped and is on the way.`;
  } else if (status === 'DELIVERED') {
    title = 'Order Delivered Successfully!';
    // Update shipment status to DELIVERED
    await prisma.shipment.updateMany({
      where: { orderId: order.id },
      data: { status: 'DELIVERED', deliveredAt: new Date() },
    }).catch(() => {});

    // If Reseller order, credit Reseller's wallet with profit margin!
    if (order.isResellerOrder && order.resellerUserId && Number(order.resellerMargin || 0) > 0) {
      try {
        let wallet = await prisma.wallet.findUnique({ where: { userId: order.resellerUserId } });
        if (!wallet) {
          wallet = await prisma.wallet.create({ data: { userId: order.resellerUserId, balance: 0 } });
        }
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: order.resellerMargin! } },
        });
        await prisma.walletTxn.create({
          data: {
            walletId: wallet.id,
            type: 'CREDIT',
            amount: order.resellerMargin!,
            description: `Reseller Margin Profit for order #${order.id.slice(0, 8)}`,
            reference: order.id,
          },
        });
        console.log(`[ResellerPayout] Credited ₹${Number(order.resellerMargin)} to reseller ${order.resellerUserId}`);
        await createInAppNotification(
          order.resellerUserId,
          'WALLET',
          'Reseller Profit Credited! 🎉',
          `Congratulations! Your profit margin of ₹${Number(order.resellerMargin)} for order #${order.id.slice(0, 8)} has been credited to your TRADENEST Wallet!`,
          { orderId: order.id, amount: Number(order.resellerMargin), type: 'RESELLER_PAYOUT' }
        );
      } catch (walletErr) {
        console.warn('Failed to credit reseller margin to wallet:', walletErr);
      }
    }
    body = `Your order #${order.id.slice(0, 8)} has been delivered. Thank you for shopping with TRADENEST!`;
    // If order was Cash on Delivery, mark payment as SUCCESS (Cash Collected)
    await prisma.payment.updateMany({
      where: { orderId: order.id, provider: PaymentProvider.COD, status: PaymentStatus.INITIATED },
      data: {
        status: PaymentStatus.SUCCESS,
        rawResponse: { type: 'COD', cashCollected: true, collectedAt: new Date().toISOString() },
      },
    }).catch((err) => console.warn('Failed to update COD payment to SUCCESS upon delivery:', err));
  } else if (status === 'CANCELLED') {
    title = 'Order Cancelled';
    body = `Your order #${order.id.slice(0, 8)} has been cancelled.`;
    // If order was Cash on Delivery, mark payment as FAILED / CANCELLED
    await prisma.payment.updateMany({
      where: { orderId: order.id, provider: PaymentProvider.COD, status: PaymentStatus.INITIATED },
      data: {
        status: PaymentStatus.FAILED,
        rawResponse: { type: 'COD', cancelled: true, cancelledAt: new Date().toISOString() },
      },
    }).catch((err) => console.warn('Failed to update COD payment to FAILED upon cancellation:', err));
  }

  // Create notification for customer
  await createInAppNotification(order.userId, 'ORDER', title, body, { orderId: order.id, status });

  // Dispatch email to customer (especially for approval CONFIRMED, SHIPPED, and DELIVERED)
  const customer = await findUserForEmail(order.userId);
  if (customer && customer.email) {
    sendOrderStatusEmail(order, customer, status).catch((err) => {
      console.warn('Failed to send status update email:', err);
    });
  }

  res.json(order);
}));

// GET /api/orders/seller/:sellerId - Get order items for a specific seller
router.get('/seller/:sellerId', asyncHandler(async (req, res) => {
  const query = OrderQuerySchema.parse(req.query);
  const { page, limit, sort, order, status, startDate, endDate } = query;
  let rawSellerId = req.params.sellerId;

  if (rawSellerId === 'me') {
    rawSellerId = req.headers['x-user-id'] as string;
  }

  if (!rawSellerId) {
    throw new ValidationError('Seller ID not found in request');
  }

  const sellerIds = await resolveSellerIds(rawSellerId);

  const where: any = {
    sellerId: { in: sellerIds },
  };

  if (status) {
    where.order = { ...where.order, status };
  }
  if (startDate || endDate) {
    where.order = {
      ...where.order,
      createdAt: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      },
    };
  }

  const orderBy: any = sort ? { [sort]: order } : { order: { createdAt: 'desc' } };

  const [items, total] = await Promise.all([
    prisma.orderItem.findMany({
      where,
      include: {
        order: {
          include: {
            payment: true,
          },
        },
        product: true,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.orderItem.count({ where }),
  ]);

  const formattedItems = items.map((item: any) => ({
    id: item.id,
    orderId: item.orderId,
    productId: item.productId,
    sellerId: item.sellerId,
    title: item.title,
    price: Number(item.price),
    quantity: item.quantity,
    discount: Number(item.discount),
    subtotal: Number(item.price) * item.quantity,
    product: item.product,
    order: {
      id: item.order.id,
      userId: item.order.userId,
      status: item.order.status,
      total: Number(item.order.total),
      subtotal: Number(item.order.subtotal),
      shipping: Number(item.order.shipping),
      discount: Number(item.order.discount),
      couponCode: item.order.couponCode,
      shippingAddress: item.order.shippingAddress,
      billingAddress: item.order.billingAddress,
      payment: item.order.payment ? {
        id: item.order.payment.id,
        provider: item.order.payment.provider,
        status: item.order.payment.status,
        amount: Number(item.order.payment.amount),
        providerRef: item.order.payment.providerRef,
      } : null,
      createdAt: item.order.createdAt,
      updatedAt: item.order.updatedAt,
    },
    createdAt: item.order.createdAt,
  }));

  res.json({ data: formattedItems, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

// GET /api/orders/seller/:sellerId/orders - Get distinct orders for a seller (grouped by order)
router.get('/seller/:sellerId/orders', asyncHandler(async (req, res) => {
  const rawStatus = req.query.status as string | undefined;
  const queryObj = { ...req.query };
  if (rawStatus === 'RETURN_REQUESTED' || rawStatus === 'All' || rawStatus === 'RETURNED') {
    delete queryObj.status;
  }
  const query = OrderQuerySchema.parse(queryObj);
  const { page, limit, sort, order, startDate, endDate } = query;
  let rawSellerId = req.params.sellerId;
  const userRole = req.headers['x-user-role'] as string;
  const userId = req.headers['x-user-id'] as string;

  if (rawSellerId === 'me') {
    rawSellerId = userId;
  }

  if (!rawSellerId) {
    throw new ValidationError('Seller ID not found in request');
  }

  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const sellerIds = await resolveSellerIds(rawSellerId);

  const where: any = (isAdmin && sellerIds.length <= 1)
    ? {}
    : {
        items: {
          some: {
            sellerId: { in: sellerIds },
          },
        },
      };

  if (rawStatus === 'RETURN_REQUESTED') {
    where.returns = {
      some: {
        status: 'PENDING',
      },
    };
  } else if (rawStatus === 'RETURNED') {
    where.OR = [
      { status: OrderStatus.RETURNED },
      { returns: { some: { status: { in: ['APPROVED', 'COMPLETED'] } } } },
    ];
  } else if (rawStatus && rawStatus !== 'All') {
    where.status = rawStatus;
  }
  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };
  }

  const orderBy: any = sort ? { [sort]: order } : { createdAt: 'desc' };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        payment: true,
        returns: true,
        items: {
          where: (isAdmin && sellerIds.length <= 1) ? undefined : { sellerId: { in: sellerIds } },
          include: { product: true },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  const formattedOrders = orders.map((o: any) => ({
    id: o.id,
    userId: o.userId,
    status: o.status,
    total: Number(o.total),
    subtotal: Number(o.subtotal),
    shipping: Number(o.shipping),
    discount: Number(o.discount),
    couponCode: o.couponCode,
    shippingAddress: o.shippingAddress,
    billingAddress: o.billingAddress,
    payment: o.payment ? {
      id: o.payment.id,
      provider: o.payment.provider,
      status: o.payment.status,
      amount: Number(o.payment.amount),
      providerRef: o.payment.providerRef,
    } : null,
    items: (o.items || []).map((oi: any) => ({
      id: oi.id,
      productId: oi.productId,
      sellerId: oi.sellerId,
      title: oi.title,
      price: Number(oi.price),
      quantity: oi.quantity,
      discount: Number(oi.discount),
      subtotal: Number(oi.price) * oi.quantity,
      product: oi.product,
    })),
    returns: o.returns || [],
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }));

  res.json({ data: formattedOrders, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

// PATCH /api/orders/:id/return/process - Seller or Admin approves/rejects return
router.patch('/:id/return/process', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as string;
  if (!userId) {
    throw new ValidationError('User ID not found in request');
  }

  const { status, rejectionReason } = req.body || {};
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw new ValidationError('Status must be APPROVED or REJECTED');
  }

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, returns: true },
  });
  if (!order) throw new NotFoundError('Order');

  const sellerIds = await resolveSellerIds(userId);
  const isSellerOfItem = order.items.some((item: any) => sellerIds.includes(item.sellerId));
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  if (!isSellerOfItem && !isAdmin) {
    throw new ValidationError('Unauthorized: Only the seller or an admin can process this return');
  }

  const activeReturn = order.returns?.find((r: any) => r.status === 'PENDING' || r.status === 'APPROVED');
  if (!activeReturn) {
    throw new ValidationError('No active return request found for this order');
  }

  // Update ReturnRequest
  const updatedReturn = await prisma.returnRequest.update({
    where: { id: activeReturn.id },
    data: {
      status,
      rejectionReason: status === 'REJECTED' ? (rejectionReason || 'Return criteria not met') : null,
    },
  });

  // If approved, update order status to RETURNED and restore inventory
  if (status === 'APPROVED') {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.RETURNED },
    });

    for (const item of order.items) {
      await prisma.inventory.updateMany({
        where: { productId: item.productId },
        data: {
          quantity: { increment: item.quantity },
        },
      });
    }
  }

  // Notify customer of decision via In-App Notification and Email
  try {
    await createInAppNotification(
      order.userId,
      'ORDER',
      status === 'APPROVED' ? 'Return Approved & Logistics Scheduled' : 'Return Request Declined',
      status === 'APPROVED'
        ? `Your return request for Order #${order.id.slice(0, 8)} was approved by the seller. Reverse pickup is being scheduled.`
        : `Your return request for Order #${order.id.slice(0, 8)} was declined. Reason: ${rejectionReason || 'Return criteria not met'}`,
      { orderId: order.id, status }
    );

    const customerUser = await findUserForEmail(order.userId);
    if (customerUser) {
      sendReturnDecisionCustomerEmail(order, customerUser, status, rejectionReason).catch((err: any) =>
        console.warn('Failed to send return decision email to customer:', err)
      );
    }
  } catch (notifErr) {
    console.warn('Error sending customer return decision notification:', notifErr);
  }

  res.json({
    message: status === 'APPROVED' ? 'Return request approved and order marked as Returned' : 'Return request rejected',
    returnRequest: updatedReturn,
  });
}));

export { router as orderRouter };
// Auto-release abandoned reservations older than 15 minutes to prevent phantom stockouts
async function releaseExpiredReservations() {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        createdAt: { lt: fifteenMinutesAgo },
        payment: { status: { not: PaymentStatus.SUCCESS } },
      },
      include: { items: true },
    });

    for (const expOrder of expiredOrders) {
      await prisma.$transaction(async (tx) => {
        for (const item of expOrder.items) {
          await tx.inventory.update({
            where: { productId: item.productId },
            data: { reserved: { decrement: item.quantity } },
          }).catch(() => {});
        }
        await tx.order.update({
          where: { id: expOrder.id },
          data: { status: OrderStatus.CANCELLED },
        });
      });
      console.log(`[AutoRelease] Released abandoned reserved inventory for order ${expOrder.id}`);
    }
  } catch (err) {
    console.warn('[AutoRelease] Error releasing expired reservations:', err);
  }
}
setInterval(releaseExpiredReservations, 5 * 60 * 1000);
