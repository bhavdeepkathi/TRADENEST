import { Router } from 'express';
import { prisma } from '../../utils/prisma';
import { asyncHandler } from '../../middlewares/errorHandler';
import { NotFoundError } from '@tradenest/common';

const router = Router();

// GET /api/wallet - Get wallet balance
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  let wallet = await prisma.wallet.findUnique({ where: { userId }, include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } } });
  if (!wallet) { wallet = await prisma.wallet.create({ data: { userId } }); }
  res.json(wallet);
}));

// POST /api/wallet/add - Add money to wallet
router.post('/add', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { amount, paymentMethod } = req.body;
  
  const wallet = await prisma.wallet.upsert({
    where: { userId },
    create: { userId, balance: amount },
    update: { balance: { increment: amount } },
  });

  await prisma.walletTxn.create({ data: { walletId: wallet.id, type: 'CREDIT', amount, description: `Added via ${paymentMethod}`, reference: 'wallet_topup' } });
  res.json(wallet);
}));

// GET /api/wallet/transactions - Get transaction history
router.get('/transactions', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new NotFoundError('Wallet');
  const transactions = await prisma.walletTxn.findMany({ where: { walletId: wallet.id }, orderBy: { createdAt: 'desc' } });
  res.json(transactions);
}));

export { router as walletRouter };