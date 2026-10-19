import { Router, type Request } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { asyncHandler } from '../../middlewares/errorHandler';
import { ExternalServiceError, NotFoundError, ValidationError } from '@tradenest/common';
import { CreatePaymentIntentDtoSchema, RefundDtoSchema, PaymentProvider, PaymentStatus } from '@tradenest/common';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import Razorpay from 'razorpay';
import { createHmac, timingSafeEqual } from 'node:crypto';

const router = Router();
function validate(schema: z.ZodSchema) { return (req: any, res: any, next: any) => { const result = schema.safeParse(req.body); if (!result.success) throw new ValidationError('Invalid request data', result.error.flatten().fieldErrors); req.body = result.data; next(); }; }

const verifyPaymentSchema = z.object({
  paymentId: z.string().min(1),
  provider: z.nativeEnum(PaymentProvider),
  providerRef: z.string().min(1),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
});

const razorpayWebhookSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        order_id: z.string().optional(),
        amount: z.number().int().nonnegative(),
        currency: z.string().optional(),
      }).passthrough(),
    }).optional(),
  }).optional(),
}).passthrough();

function getRazorpayCredentials() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = config;
  if (!RAZORPAY_KEY_ID?.trim() || !RAZORPAY_KEY_SECRET?.trim()) {
    throw new ValidationError('Razorpay is not configured');
  }

  return { keyId: RAZORPAY_KEY_ID, keySecret: RAZORPAY_KEY_SECRET };
}

function getRazorpayClient(): Razorpay {
  const { keyId, keySecret } = getRazorpayCredentials();
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function getRazorpayErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error !== 'object' || error === null || !('error' in error)) {
    return 'Razorpay order creation failed';
  }

  const details = error.error;
  if (typeof details !== 'object' || details === null) {
    return 'Razorpay order creation failed';
  }

  const description =
    'description' in details && typeof details.description === 'string'
      ? details.description
      : undefined;
  const code =
    'code' in details && typeof details.code === 'string' ? details.code : undefined;

  if (description && code) return `Razorpay rejected the order (${code}): ${description}`;
  return description || (code ? `Razorpay rejected the order (${code})` : 'Razorpay order creation failed');
}

function verifyHmac(secret: string, message: Buffer | string, signature: string): boolean {
  if (!/^[a-f\d]{64}$/i.test(signature)) return false;
  const expected = createHmac('sha256', secret).update(message).digest();
  const received = Buffer.from(signature, 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

// POST /api/payments/intent - Create payment intent
router.post('/intent', validate(CreatePaymentIntentDtoSchema), asyncHandler(async (req, res) => {
  const { orderId, provider } = req.body;
  if (provider === PaymentProvider.STRIPE) {
    throw new ValidationError('Stripe payments are not currently supported');
  }
  
  // Fetch order to get amount
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order');
  if (Number(order.total) <= 0) throw new ValidationError('Invalid order amount');

  const amountInPaise = Math.round(Number(order.total) * 100); // Razorpay expects paise
  
  let response: any = { provider, orderId, amount: Number(order.total), currency: 'INR' };
  
  // Check if payment already exists for this order
  let payment = await prisma.payment.findUnique({ where: { orderId } });
  if (payment?.status === PaymentStatus.SUCCESS) {
    throw new ValidationError('Payment has already been completed');
  }
  
  if (provider === PaymentProvider.RAZORPAY || provider === PaymentProvider.UPI) {
    const razorpay = getRazorpayClient();
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderId,
        notes: { orderId },
      });
    } catch (error) {
      logger.error({ err: error, orderId }, 'Razorpay order creation failed');
      throw new ExternalServiceError('Razorpay', getRazorpayErrorMessage(error));
    }

    response.razorpayOrderId = razorpayOrder.id;
    response.razorpayKeyId = config.RAZORPAY_KEY_ID;
  } else if (provider === PaymentProvider.WALLET) {
    // Wallet payment - check balance
    const userId = req.headers['x-user-id'] as string;
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    
    if (!wallet || Number(wallet.balance) < Number(order.total)) {
      throw new ValidationError('Insufficient wallet balance');
    }
    
    response.walletBalance = Number(wallet.balance);
    response.orderTotal = Number(order.total);
    response.remainingBalance = Number(wallet.balance) - Number(order.total);
  }

  // Create or update payment record
  const providerRef = response.razorpayOrderId || `wallet_${Date.now()}`;
  
  if (payment) {
    payment = await prisma.payment.update({
      where: { id: payment.id },
      data: { provider, providerRef, amount: order.total, status: PaymentStatus.INITIATED },
    });
  } else {
    payment = await prisma.payment.create({
      data: { orderId, provider, providerRef, amount: order.total, status: PaymentStatus.INITIATED },
    });
  }

  response.paymentId = payment.id;
  res.json(response);
}));

// POST /api/payments/verify - Verify payment after user completes it
router.post('/verify', asyncHandler(async (req, res) => {
  const parsedBody = verifyPaymentSchema.safeParse(req.body);
  if (!parsedBody.success) {
    throw new ValidationError('Invalid request data', parsedBody.error.flatten().fieldErrors);
  }
  const { paymentId, provider, providerRef, razorpayPaymentId, razorpaySignature } = parsedBody.data;
  if (provider === PaymentProvider.STRIPE) {
    throw new ValidationError('Stripe payments are not currently supported');
  }
  
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
  if (!payment) throw new NotFoundError('Payment');
  if (payment.provider !== provider) {
    throw new ValidationError('Payment provider does not match the payment record');
  }
  if (payment.status === PaymentStatus.SUCCESS) {
    if (payment.providerRef !== providerRef) {
      throw new ValidationError('Payment verification failed');
    }
    return res.json({ success: true, payment });
  }
  
  let verified = false;
  let verifiedAmount = 0;
  
  if (provider === PaymentProvider.RAZORPAY || provider === PaymentProvider.UPI) {
    if (
      !razorpayPaymentId ||
      !razorpaySignature ||
      !providerRef ||
      providerRef !== payment.providerRef ||
      payment.provider !== provider
    ) {
      throw new ValidationError('Payment verification failed');
    }

    const { keyId, keySecret } = getRazorpayCredentials();
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const signatureValid = verifyHmac(
      keySecret,
      `${providerRef}|${razorpayPaymentId}`,
      razorpaySignature,
    );
    if (!signatureValid) throw new ValidationError('Payment verification failed');

    const razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId);
    const expectedAmountInPaise = Math.round(Number(payment.amount) * 100);
    if (
      razorpayPayment.order_id !== providerRef ||
      razorpayPayment.status !== 'captured' ||
      razorpayPayment.amount !== expectedAmountInPaise ||
      razorpayPayment.currency !== payment.currency
    ) {
      throw new ValidationError('Razorpay payment is not captured for the expected amount');
    }

    verified = true;
    verifiedAmount = Number(payment.amount);
  } else if (provider === PaymentProvider.WALLET) {
    // Wallet payment - deduct balance
    const userId = req.headers['x-user-id'] as string;
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    
    if (!wallet || Number(wallet.balance) < Number(payment.amount)) {
      throw new ValidationError('Insufficient wallet balance');
    }
    
    // Deduct from wallet
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: payment.amount } },
    });
    
    // Create wallet transaction
    await prisma.walletTxn.create({
      data: {
        walletId: wallet.id,
        type: 'DEBIT',
        amount: payment.amount,
        description: `Payment for order ${payment.orderId}`,
        reference: payment.id,
      },
    });
    
    verified = true;
    verifiedAmount = Number(payment.amount);
  }
  
  if (!verified) {
    if (provider !== PaymentProvider.RAZORPAY && provider !== PaymentProvider.UPI) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.FAILED, rawResponse: req.body },
      });
    }
    throw new ValidationError('Payment verification failed');
  }
  
  // Verify amount matches
  if (Math.abs(verifiedAmount - Number(payment.amount)) > 1) {
    throw new ValidationError('Payment amount mismatch');
  }
  
  // Update payment status
  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: { 
      status: PaymentStatus.SUCCESS, 
      providerRef: payment.providerRef,
      rawResponse: req.body,
    },
    include: { order: true },
  });
  
  res.json({ success: true, payment: updatedPayment });
}));

// POST /api/payments/webhook - Handle provider webhooks
router.post('/webhook/:provider', asyncHandler(async (req, res) => {
  const { provider } = req.params;

  if (provider === 'razorpay') {
    const webhookSecret = config.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.get('x-razorpay-signature');
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!webhookSecret?.trim() || !signature || !rawBody || !verifyHmac(webhookSecret, rawBody, signature)) {
      throw new ValidationError('Invalid Razorpay webhook signature');
    }

    const parsedEvent = razorpayWebhookSchema.safeParse(req.body);
    if (!parsedEvent.success) {
      throw new ValidationError('Invalid Razorpay webhook payload', parsedEvent.error.flatten().fieldErrors);
    }
    const { event, payload } = parsedEvent.data;
    if (event === 'payment.captured' || event === 'payment.failed') {
      const entity = payload?.payment?.entity;
      if (!entity?.order_id) throw new ValidationError('Razorpay webhook is missing its order reference');

      const payment = await prisma.payment.findFirst({
        where: {
          providerRef: entity.order_id,
          provider: { in: [PaymentProvider.RAZORPAY, PaymentProvider.UPI] },
        },
      });

      if (payment && payment.status !== PaymentStatus.SUCCESS) {
        if (event === 'payment.captured') {
          const expectedAmountInPaise = Math.round(Number(payment.amount) * 100);
          if (entity.amount !== expectedAmountInPaise || entity.currency !== payment.currency) {
            throw new ValidationError('Razorpay webhook amount does not match the payment');
          }
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.SUCCESS,
              rawResponse: {
                razorpayPaymentId: entity.id,
                razorpayWebhookVerified: true,
                webhookEvent: event,
              },
            },
          });
        } else {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.FAILED, rawResponse: req.body },
          });
        }
      }
    }
  } else {
    throw new ValidationError('Unsupported payment webhook provider');
  }
  
  res.json({ received: true });
}));

// POST /api/payments/refund - Process refund
router.post('/refund', validate(RefundDtoSchema), asyncHandler(async (req, res) => {
  const { paymentId, amount, reason } = req.body;
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new NotFoundError('Payment');
  if (payment.status !== PaymentStatus.SUCCESS) throw new ValidationError('Payment not successful');

  const refund = await prisma.refund.create({ data: { paymentId, amount: amount || payment.amount, reason } });
  res.status(201).json(refund);
}));

// GET /api/payments/:id - Get payment details
router.get('/:id', asyncHandler(async (req, res) => {
  const payment = await prisma.payment.findUnique({ where: { id: req.params.id }, include: { refund: true, order: true } });
  if (!payment) throw new NotFoundError('Payment');
  res.json(payment);
}));

export { router as paymentRouter };