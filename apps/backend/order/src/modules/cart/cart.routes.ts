import { Router } from 'express';
import { prisma } from '../../utils/prisma';
import { asyncHandler } from '../../middlewares/errorHandler';
import { ValidationError } from '@tradenest/common';

const router = Router();

function userId(req: any): string {
  const id = req.headers['x-user-id'];
  if (typeof id !== 'string' || !id) throw new ValidationError('Authentication required');
  return id;
}

async function getOrCreateCart(id: string) {
  return prisma.cart.upsert({
    where: { userId: id },
    update: {},
    create: { userId: id },
    include: {
      items: {
        include: { product: { include: { seller: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

function formatCart(cart: any) {
  const items = cart.items.map((item: any) => ({
    ...item,
    subtotal: Number(item.product.price) * item.quantity,
  }));
  return {
    id: cart.id,
    items,
    subtotal: items.reduce((sum: number, item: any) => sum + item.subtotal, 0),
    itemCount: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
  };
}

router.get('/', asyncHandler(async (req, res) => {
  res.json(formatCart(await getOrCreateCart(userId(req))));
}));

router.post('/items', asyncHandler(async (req, res) => {
  const id = userId(req);
  const productId = typeof req.body.productId === 'string' ? req.body.productId : '';
  const quantity = Number(req.body.quantity);
  if (!productId || !Number.isInteger(quantity) || quantity < 1) {
    throw new ValidationError('Product and a positive quantity are required');
  }

  const product = await prisma.product.findUnique({ where: { id: productId }, include: { inventory: true } });
  if (!product || product.status !== 'ACTIVE') {
    throw new ValidationError('Product is not available for purchase');
  }

  const sellerKyc = await prisma.$queryRaw<Array<{ kycStatus: string }>>`
    SELECT "kycStatus" FROM "Seller" WHERE id = ${product.sellerId} OR "userId" = ${product.sellerId} LIMIT 1
  `.catch(() => []);
  if (sellerKyc.length > 0 && sellerKyc[0].kycStatus !== 'APPROVED') {
    throw new ValidationError('Product is not available for purchase (seller not approved)');
  }

  const cart = await prisma.cart.upsert({ where: { userId: id }, update: {}, create: { userId: id } });
  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  const requestedQuantity = (existingItem?.quantity ?? 0) + quantity;
  if (!product.inventory || product.inventory.quantity - product.inventory.reserved < requestedQuantity) {
    throw new ValidationError('Insufficient stock');
  }
  const item = await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: { increment: quantity } },
    create: { cartId: cart.id, productId, quantity },
  });
  res.status(201).json(item);
}));

router.patch('/items/:productId', asyncHandler(async (req, res) => {
  const cart = await prisma.cart.findUnique({ where: { userId: userId(req) } });
  const quantity = Number(req.body.quantity);
  if (!cart || !Number.isInteger(quantity) || quantity < 1) throw new ValidationError('A positive quantity is required');
  const item = await prisma.cartItem.update({
    where: { cartId_productId: { cartId: cart.id, productId: req.params.productId } },
    data: { quantity },
  });
  res.json(item);
}));

router.delete('/items/:productId', asyncHandler(async (req, res) => {
  const cart = await prisma.cart.findUnique({ where: { userId: userId(req) } });
  if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId: req.params.productId } });
  res.status(204).send();
}));

router.delete('/', asyncHandler(async (req, res) => {
  const cart = await prisma.cart.findUnique({ where: { userId: userId(req) } });
  if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  res.json({ message: 'Cart cleared' });
}));

export { router as cartRouter };