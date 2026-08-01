import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { asyncHandler } from '../../middlewares/errorHandler';
import { NotFoundError, ValidationError } from '@tradenest/common';
import { CreatePaymentIntentDtoSchema, RefundDtoSchema, PaymentProvider, PaymentStatus } from '@tradenest/common';

const router = Router();
function validate(schema: z.ZodSchema) { return (req: any, res: any, next: any) => { const result = schema.safeParse(req.body); if (!result.success) throw new ValidationError('Invalid request data', result.error.flatten().fieldErrors); req.body = result.data; next(); }; }

// POST /api/payments/intent - Create payment intent
router.post('/intent', validate(CreatePaymentIntentDtoSchema), asyncHandler(async (req, res) => {
  const { orderId, provider } = req.body;
  
  // In real implementation: fetch order, create payment intent with provider
  let response: any = { provider, orderId, amount: 1000, currency: 'INR' };
  
  if (provider === PaymentProvider.RAZORPAY) {
    // const razorpay = new Razorpay({ key_id: config.RAZORPAY_KEY_ID!, key_secret: config.RAZORPAY_KEY_SECRET! });
    // const order = await razorpay.orders.create({ amount: 100000, currency: 'INR', receipt: orderId });
    // response.razorpayOrderId = order.id;
    response.razorpayOrderId = 'order_mock_' + Date.now();
  } else if (provider === PaymentProvider.STRIPE) {
    // const stripe = new Stripe(config.STRIPE_SECRET_KEY!);
    // const paymentIntent = await stripe.paymentIntents.create({ amount: 100000, currency: 'inr', metadata: { orderId } });
    // response.stripeClientSecret = paymentIntent.client_secret;
    response.stripeClientSecret = 'pi_mock_' + Date.now();
  } else if (provider === PaymentProvider.UPI) {
    response.upiIntent = 'upi://pay?pa=merchant@upi&pn=TRADENEST&am=1000&cu=INR';
  }

  // Save payment record
  await prisma.payment.create({
    data: { orderId, provider, providerRef: response.razorpayOrderId || response.stripeClientSecret || 'mock', amount: 1000, status: PaymentStatus.INITIATED },
  });

  res.json(response);
}));

// POST /api/payments/webhook - Handle provider webhooks
router.post('/webhook/:provider', asyncHandler(async (req, res) => {
  const { provider } = req.params;
  // In real implementation: verify signature, process webhook
  logger.info(`Webhook received from ${provider}:`, req.body);
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
  const payment = await prisma.payment.findUnique({ where: { id: req.params.id }, include: { refund: true } });
  if (!payment) throw new NotFoundError('Payment');
  res.json(payment);
}));

export { router as paymentRouter };