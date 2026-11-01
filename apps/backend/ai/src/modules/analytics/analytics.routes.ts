import { Router, Request, Response } from 'express';
import { prisma } from '../../utils/prisma';
import { asyncHandler } from '../../middlewares/errorHandler';

const router = Router();

// GET /api/ai/analytics/trending - Get trending products with dynamic fallback
router.get('/trending', asyncHandler(async (req: Request, res: Response) => {
  const trending = await prisma.trendingProduct.findMany({
    orderBy: { score: 'desc' },
    take: 20,
  });

  if (trending.length > 0) {
    const pids = trending.map((t) => t.productId);
    const prods = await prisma.$queryRaw<Array<any>>`
      SELECT "id", "title", "slug", "price", "mrp", "discountPercent", "images", "ratingAvg", "reviewCount"
      FROM "Product"
      WHERE "id" IN (${pids.length > 0 ? pids : ''})
    `;
    const map = new Map(prods.map((p) => [p.id, p]));
    return res.json(
      trending.map((t) => ({
        ...t,
        product: map.get(t.productId) || null,
      }))
    );
  }

  // Dynamic fallback to top-rated products
  const topProducts = await prisma.$queryRaw<Array<any>>`
    SELECT "id", "title", "slug", "price", "mrp", "discountPercent", "images", "ratingAvg", "reviewCount"
    FROM "Product"
    WHERE "status" = 'ACTIVE'
    ORDER BY "ratingAvg" DESC NULLS LAST, "reviewCount" DESC
    LIMIT 12
  `;

  const formatted = topProducts.map((p: any, idx: number) => ({
    id: `trend_fallback_${p.id}`,
    productId: p.id,
    score: Number((98 - idx * 2).toFixed(1)),
    windowStart: new Date(Date.now() - 7 * 86400000),
    windowEnd: new Date(),
    product: {
      ...p,
      price: Number(p.price),
      mrp: p.mrp ? Number(p.mrp) : null,
      images: Array.isArray(p.images) ? p.images : [],
    },
  }));

  res.json(formatted);
}));

// GET /api/ai/analytics/forecast - Get sales forecast
router.get('/forecast', asyncHandler(async (req: Request, res: Response) => {
  const { productId, categoryId, period } = req.query;
  const where: any = {};
  if (productId) where.productId = productId as string;
  if (categoryId) where.categoryId = categoryId as string;
  if (period) where.period = period as string;
  const forecasts = await prisma.salesForecast.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
  res.json(forecasts);
}));

// GET /api/ai/analytics/fraud-alerts - Get fraud alerts
router.get('/fraud-alerts', asyncHandler(async (req: Request, res: Response) => {
  const alerts = await prisma.fraudAlert.findMany({ where: { resolved: false }, orderBy: { createdAt: 'desc' }, take: 50 });
  res.json(alerts);
}));

export { router as analyticsRouter };
