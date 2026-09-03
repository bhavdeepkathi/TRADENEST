import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { asyncHandler } from '../../middlewares/errorHandler';
import { RecommendationQuerySchema } from '@tradenest/common';

const router = Router();

// GET /api/ai/recommendations - Get personalized recommendations
router.get('/', asyncHandler(async (req, res) => {
  const query = RecommendationQuerySchema.parse(req.query);
  const { userId, productId, type, limit } = query;

  const where: any = { type };
  if (userId) where.userId = userId;
  if (productId) where.productId = productId;

  const recommendations = await prisma.aIRecommendation.findMany({
    where,
    orderBy: { score: 'desc' },
    take: limit,
    include: { product: { select: { id: true, title: true, slug: true, price: true, mrp: true, images: true, ratingAvg: true, reviewCount: true } } },
  });

  res.json(recommendations);
}));

// POST /api/ai/recommendations/track - Track user behavior for recommendations
router.post('/track', asyncHandler(async (req, res) => {
  const { userId, eventType, eventData } = req.body;
  await prisma.customerBehavior.create({ data: { userId, eventType, eventData } });
  res.json({ success: true });
}));

export { router as recommendationRouter };