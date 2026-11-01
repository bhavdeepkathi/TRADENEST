import { Router, Request, Response } from 'express';
import { prisma } from '../../utils/prisma';
import { asyncHandler } from '../../middlewares/errorHandler';
import { RecommendationQuerySchema } from '@tradenest/common';

const router = Router();

// GET /api/ai/recommendations - Get personalized recommendations with intelligent dynamic fallback
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const parseResult = RecommendationQuerySchema.safeParse(req.query);
  const type = parseResult.success ? parseResult.data.type : ((req.query.type as any) || 'SIMILAR');
  const limit = parseResult.success ? parseResult.data.limit : (Number(req.query.limit) || 8);
  const userId = (parseResult.success ? parseResult.data.userId : req.query.userId) as string | undefined;
  const productId = (parseResult.success ? parseResult.data.productId : req.query.productId) as string | undefined;

  const where: any = { type };
  if (userId) where.userId = userId;
  if (productId) where.productId = productId;

  const recommendations = await prisma.aIRecommendation.findMany({
    where,
    orderBy: { score: 'desc' },
    take: limit,
  });

  // If personalized recommendations exist, enrich them with products
  if (recommendations.length > 0) {
    const productIds = recommendations.map((r) => r.productId);
    const prods = await prisma.$queryRaw<Array<any>>`
      SELECT "id", "title", "slug", "price", "mrp", "discountPercent", "images", "ratingAvg", "reviewCount", "brand"
      FROM "Product"
      WHERE "id" IN (${productIds.length > 0 ? productIds : ''})
    `;
    const prodMap = new Map(prods.map((p) => [p.id, p]));

    return res.json(
      recommendations.map((r) => ({
        ...r,
        product: prodMap.get(r.productId) || null,
      }))
    );
  }

  // Intelligent Fallback:
  // 1. If productId was passed, find its category
  let categoryId: string | undefined;
  if (productId) {
    const currentProd = await prisma.$queryRaw<Array<{ categoryId: string }>>`
      SELECT "categoryId" FROM "Product" WHERE "id" = ${productId} LIMIT 1
    `;
    categoryId = currentProd[0]?.categoryId;
  }

  let fallbackProducts: any[] = [];
  if (categoryId) {
    fallbackProducts = await prisma.$queryRaw<Array<any>>`
      SELECT "id", "title", "slug", "price", "mrp", "discountPercent", "images", "ratingAvg", "reviewCount", "brand"
      FROM "Product"
      WHERE "status" = 'ACTIVE' AND "categoryId" = ${categoryId} AND "id" != ${productId}
      ORDER BY "ratingAvg" DESC NULLS LAST, "reviewCount" DESC, "createdAt" DESC
      LIMIT ${limit}
    `;
  }

  if (fallbackProducts.length === 0) {
    fallbackProducts = await prisma.$queryRaw<Array<any>>`
      SELECT "id", "title", "slug", "price", "mrp", "discountPercent", "images", "ratingAvg", "reviewCount", "brand"
      FROM "Product"
      WHERE "status" = 'ACTIVE'
      ORDER BY "ratingAvg" DESC NULLS LAST, "reviewCount" DESC, "createdAt" DESC
      LIMIT ${limit}
    `;
  }

  const formattedFallback = fallbackProducts.map((p: any, idx: number) => ({
    id: `rec_fallback_${p.id}`,
    userId: userId || null,
    productId: p.id,
    type: type || 'SIMILAR_PRODUCTS',
    score: Number((0.98 - idx * 0.03).toFixed(2)),
    product: {
      ...p,
      price: Number(p.price),
      mrp: p.mrp ? Number(p.mrp) : null,
      images: Array.isArray(p.images) ? p.images : [],
    },
  }));

  res.json(formattedFallback);
}));

// POST /api/ai/recommendations/track - Track user behavior
router.post('/track', asyncHandler(async (req: Request, res: Response) => {
  const { userId, eventType, eventData } = req.body;
  if (userId && eventType) {
    await prisma.customerBehavior.create({ data: { userId, eventType, eventData: eventData || {} } }).catch(() => {});
  }
  res.json({ success: true });
}));

// POST /api/ai/chat - Interactive AI Shopping Assistant
router.post('/chat', asyncHandler(async (req: Request, res: Response) => {
  const { message = '' } = req.body;
  const userQuery = (typeof message === 'string' ? message : '').trim().toLowerCase();

  if (!userQuery) {
    return res.json({
      reply: "Hello! I'm your TRADENEST AI Assistant. How can I help you find what you're looking for today?",
      quickReplies: ['🔥 Best Deals', '👟 Men Shoes', '👗 Women Fashion', '📱 Electronics', '📦 Track Order'],
    });
  }

  // 1. Order Tracking Intent
  if (userQuery.includes('order') || userQuery.includes('track') || userQuery.includes('status')) {
    const orderMatch = userQuery.match(/([a-z0-9_-]{8,})/i);
    if (orderMatch) {
      const orderSearch = orderMatch[1];
      const orders = await prisma.$queryRaw<Array<any>>`
        SELECT o."id", o."status", o."total", o."deliveryOtp", s."status" as "shipmentStatus"
        FROM "Order" o
        LEFT JOIN "Shipment" s ON s."orderId" = o."id"
        WHERE o."id" ILIKE ${'%' + orderSearch + '%'}
        LIMIT 1
      `;

      if (orders.length > 0) {
        const foundOrder = orders[0];
        const otpText = foundOrder.deliveryOtp ? `\n\n🔑 **Your Doorstep Delivery OTP is: ${foundOrder.deliveryOtp}** (Share this only when the rider arrives).` : '';
        return res.json({
          reply: `Order **#${foundOrder.id.slice(0, 8)}** is currently **${foundOrder.status}** with a total of ₹${Number(foundOrder.total).toLocaleString('en-IN')}.${foundOrder.shipmentStatus ? `\nLogistics Status: **${foundOrder.shipmentStatus}**.` : ''}${otpText}`,
          quickReplies: ['View My Orders', 'Return Policy', 'Customer Support'],
        });
      }
    }
    return res.json({
      reply: 'To track your order, please provide your Order ID (e.g. "track order cly..." or click on **Orders** in your account navigation to view live tracking with driver status and OTP).',
      quickReplies: ['Go to My Orders', 'Contact Support', 'Return Policy'],
    });
  }

  // 2. Return Policy Intent
  if (userQuery.includes('return') || userQuery.includes('refund') || userQuery.includes('exchange')) {
    return res.json({
      reply: '📦 **TRADENEST Easy Returns Policy:**\n\n• You can request a return within **7 days** of delivery directly from the Order Details page.\n• Our logistics partner will pick up the item from your doorstep.\n• Once approved, your refund is credited instantly to your TRADENEST Wallet or original payment method.',
      quickReplies: ['Go to Orders', 'Shipping Policy', 'Contact Support'],
    });
  }

  // 3. Deals / Coupons Intent
  if (userQuery.includes('coupon') || userQuery.includes('discount') || userQuery.includes('deal') || userQuery.includes('promo') || userQuery.includes('offer')) {
    const deals = await prisma.$queryRaw<Array<any>>`
      SELECT "id", "title", "slug", "price", "mrp", "discountPercent", "images", "ratingAvg", "brand"
      FROM "Product"
      WHERE "status" = 'ACTIVE' AND "discountPercent" >= 20
      ORDER BY "discountPercent" DESC
      LIMIT 4
    `;

    return res.json({
      reply: '🎉 **Today\'s Top Deals & Offers:**\nUse coupon code **WELCOME50** at checkout for ₹50 off on orders above ₹499! Here are the best discounted items right now:',
      products: deals.map((p: any) => ({ ...p, price: Number(p.price), mrp: p.mrp ? Number(p.mrp) : null, images: Array.isArray(p.images) ? p.images : [] })),
      quickReplies: ['Explore All Deals', 'Best Sellers', 'Electronics Offers'],
    });
  }

  // 4. Product Search Intent
  const keywords = userQuery
    .replace(/(find|show|search|recommend|me|some|best|looking for|cheap|top|good|buy|i want)/g, '')
    .trim()
    .split(/\s+/)
    .filter((k: string) => k.length > 2);

  const underPriceMatch = userQuery.match(/(?:under|below|less than|within)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
  const maxPrice = underPriceMatch ? parseFloat(underPriceMatch[1]) : 1000000;

  let products: any[] = [];
  if (keywords.length > 0) {
    const searchPattern = '%' + keywords[0] + '%';
    products = await prisma.$queryRaw<Array<any>>`
      SELECT "id", "title", "slug", "price", "mrp", "discountPercent", "images", "ratingAvg", "brand"
      FROM "Product"
      WHERE "status" = 'ACTIVE' 
        AND "price" <= ${maxPrice}
        AND ("title" ILIKE ${searchPattern} OR "description" ILIKE ${searchPattern} OR "brand" ILIKE ${searchPattern} OR "subcategory" ILIKE ${searchPattern})
      ORDER BY "ratingAvg" DESC NULLS LAST, "discountPercent" DESC
      LIMIT 4
    `;
  }

  if (products.length === 0) {
    products = await prisma.$queryRaw<Array<any>>`
      SELECT "id", "title", "slug", "price", "mrp", "discountPercent", "images", "ratingAvg", "brand"
      FROM "Product"
      WHERE "status" = 'ACTIVE' AND "price" <= ${maxPrice}
      ORDER BY "ratingAvg" DESC NULLS LAST, "createdAt" DESC
      LIMIT 4
    `;
  }

  const replyText = products.length > 0
    ? `I found these great options for you on TRADENEST:`
    : `I couldn't find exact matches for "${message}", but check out these trending bestsellers:`;

  res.json({
    reply: replyText,
    products: products.map((p: any) => ({
      ...p,
      price: Number(p.price),
      mrp: p.mrp ? Number(p.mrp) : null,
      images: Array.isArray(p.images) ? p.images : [],
    })),
    quickReplies: ['🔥 Hot Deals', '⭐ Top Rated', 'Help & Support'],
  });
}));

export { router as recommendationRouter };
