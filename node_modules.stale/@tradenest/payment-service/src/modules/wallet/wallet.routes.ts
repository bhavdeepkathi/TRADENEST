import { Router } from 'express';
import { prisma } from '../../utils/prisma';
import { asyncHandler } from '../../middlewares/errorHandler';
import { NotFoundError } from '@tradenest/common';

const router = Router();

// GET /api/wallet - Get wallet balance
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  let wallet = await prisma.wallet.findUnique({ where: { userId }, include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } } });
  if (!wallet) {
  wallet = await prisma.wallet.create({
    data: { userId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    }
  });
}
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

// POST /api/wallet/withdraw - Request a payout/withdrawal to UPI or Bank
router.post('/withdraw', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { amount, method, upiId, bankDetails } = req.body;

  const withdrawAmount = Number(amount);
  if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
    return res.status(400).json({ code: 'INVALID_AMOUNT', message: 'Withdrawal amount must be greater than ₹0' });
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new NotFoundError('Wallet');

  if (Number(wallet.balance) < withdrawAmount) {
    return res.status(400).json({
      code: 'INSUFFICIENT_FUNDS',
      message: `Insufficient balance. Available: ₹${Number(wallet.balance).toFixed(2)}, Requested: ₹${withdrawAmount.toFixed(2)}`,
    });
  }

  const payoutMethod = method === 'UPI' ? 'UPI' : 'BANK_TRANSFER';
  const destination = payoutMethod === 'UPI' ? `UPI (${upiId || 'Saved UPI'})` : `A/C ending in ${(bankDetails?.accountNumber || '****').slice(-4)}`;
  const txnReference = `PAYOUT_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const updatedWallet = await prisma.wallet.update({
    where: { id: wallet.id },
    data: { balance: { decrement: withdrawAmount } },
  });

  const transaction = await prisma.walletTxn.create({
    data: {
      walletId: wallet.id,
      type: 'DEBIT',
      amount: withdrawAmount,
      description: `Payout Withdrawal to ${destination}`,
      reference: txnReference,
    },
  });

  res.json({
    success: true,
    message: `Withdrawal request of ₹${withdrawAmount.toLocaleString('en-IN')} initiated successfully to ${destination}.`,
    reference: txnReference,
    remainingBalance: Number(updatedWallet.balance),
    transaction,
  });
}));

// GET /api/wallet/payouts - Get payout transactions
router.get('/payouts', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new NotFoundError('Wallet');

  const payouts = await prisma.walletTxn.findMany({
    where: {
      walletId: wallet.id,
      type: 'DEBIT',
      reference: { startsWith: 'PAYOUT_' },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(payouts);
}));

export { router as walletRouter };