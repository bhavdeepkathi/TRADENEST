import { Router } from 'express';
import { prisma } from '../../utils/prisma';
import { asyncHandler } from '../../middlewares/errorHandler';

const router = Router();

// GET /api/ai/analytics/trending - Get trending products
router.get('/trending', asyncHandler(async (req, res) => {
  const trending = await prisma.trendingProduct.findMany({
    orderBy: { score: 'desc' },
    take: 20,
    include: { product: { select: { id: true, title: true, slug: true, price: true, images: true } } },
  });
  res.json(trending);
}));

// GET /api/ai/analytics/forecast - Get sales forecast
router.get('/forecast', asyncHandler(async (req, res) => {
  const { productId, categoryId, period } = req.query;
  const where: any = {};
  if (productId) where.productId = productId;
  if (categoryId) where.categoryId = categoryId;
  if (period) where.period = period;
  const forecasts = await prisma.salesForecast.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
  res.json(forecasts);
}));

// GET /api/ai/analytics/fraud-alerts - Get fraud alerts
router.get('/fraud-alerts', asyncHandler(async (req, res) => {
  const alerts = await prisma.fraudAlert.findMany({ where: { resolved: false }, orderBy: { createdAt: 'desc' }, take: 50 });
  res.json(alerts);
}));

export { router as analyticsRouter };