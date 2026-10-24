import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { asyncHandler } from '../../middlewares/errorHandler';
import { NotFoundError, ValidationError } from '@tradenest/common';
import { ProductQuerySchema, CreateProductDtoSchema, UpdateProductDtoSchema, ProductStatus } from '@tradenest/common';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();

function validate(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) throw new ValidationError('Invalid request data', result.error.flatten().fieldErrors);
    req.body = result.data;
    next();
  };
}

// GET /api/products - List products with filters
router.get('/', asyncHandler(async (req, res) => {
  const query = ProductQuerySchema.parse(req.query);
  const { page, limit, sort, order, q, categoryId, sellerId, brand, subcategory, minPrice, maxPrice, rating, minDiscount, status, inStock } = query;

  const where: any = {};
  if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }];
  if (categoryId) where.categoryId = categoryId;
  
  // Handle 'me' sellerId - replace with authenticated user's seller ID
  let actualSellerId = sellerId;
  if (sellerId === 'me') {
    actualSellerId = req.headers['x-user-id'] as string;
  }
  if (actualSellerId) where.sellerId = actualSellerId;
  
  if (brand) where.brand = { contains: brand, mode: 'insensitive' };
  if (subcategory) where.subcategory = { contains: subcategory, mode: 'insensitive' };
  if (minPrice || maxPrice) where.price = { ...(minPrice && { gte: minPrice }), ...(maxPrice && { lte: maxPrice }) };
  if (rating) where.ratingAvg = { gte: rating };
  if (minDiscount !== undefined) where.discountPercent = { gte: minDiscount };
  if (status) where.status = status;
  else where.status = ProductStatus.ACTIVE;

  if (inStock) {
    where.inventory = { quantity: { gt: 0 } };
  }

  const sortField = ({ newest: 'createdAt', popular: 'reviewCount', rating: 'ratingAvg', discount: 'discountPercent', price: 'price' } as Record<string, string>)[sort || ''] || sort || 'createdAt';
  const orderBy: any = { [sortField]: order };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } }, inventory: true },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    data: products,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

// GET /api/products/:id - Get product detail
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
    include: {
      category: true,
      inventory: true,
      reviews: { take: 5, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!product) throw new NotFoundError('Product');
  res.json(product);
}));

// GET /api/products/:id/reviews - Get product reviews
router.get('/:id/reviews', asyncHandler(async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
    select: { id: true },
  });
  if (!product) throw new NotFoundError('Product');

  const reviews = await prisma.review.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data: reviews });
}));

// POST /api/products/:id/reviews - Submit/Update product review
router.post('/:id/reviews', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    throw new ValidationError('Authentication required');
  }

  const product = await prisma.product.findFirst({
    where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
    select: { id: true },
  });
  if (!product) throw new NotFoundError('Product');

  const { rating, title, body } = req.body || {};
  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    throw new ValidationError('Rating must be an integer between 1 and 5');
  }

  // Check if user purchased this product
  let isVerifiedPurchase = false;
  try {
    const userOrder = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT o.id FROM "Order" o 
      JOIN "OrderItem" oi ON oi."orderId" = o.id 
      WHERE o."userId" = ${userId} AND oi."productId" = ${product.id}
      LIMIT 1
    `;
    isVerifiedPurchase = userOrder.length > 0;
  } catch {
    isVerifiedPurchase = true;
  }

  const review = await prisma.review.upsert({
    where: {
      userId_productId: {
        userId,
        productId: product.id,
      },
    },
    create: {
      userId,
      productId: product.id,
      rating: Math.round(numRating),
      title: title ? String(title).trim() : null,
      body: body ? String(body).trim() : null,
      isVerifiedPurchase,
      images: [],
    },
    update: {
      rating: Math.round(numRating),
      title: title ? String(title).trim() : null,
      body: body ? String(body).trim() : null,
      isVerifiedPurchase,
    },
  });

  // Recalculate average rating and review count
  const allReviews = await prisma.review.findMany({
    where: { productId: product.id },
    select: { rating: true },
  });
  const reviewCount = allReviews.length;
  const ratingAvg = reviewCount > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;

  await prisma.product.update({
    where: { id: product.id },
    data: {
      ratingAvg: Math.round(ratingAvg * 100) / 100,
      reviewCount,
    },
  });

  res.status(201).json(review);
}));

// POST /api/products - Create product (seller)
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const sellerId = req.headers['x-user-id'] as string;
  if (!sellerId) {
    throw new ValidationError('Authentication required', { sellerId: ['Seller ID not found in request'] });
  }

  // Ensure seller record exists in the shared Seller table (managed by order service)
  // First check if seller exists for this userId
  const existingSeller = await prisma.$queryRaw`SELECT id FROM "Seller" WHERE "userId" = ${sellerId} LIMIT 1` as Array<{id: string}>;
  let actualSellerId: string;
  
  if (existingSeller.length > 0) {
    actualSellerId = existingSeller[0].id;
  } else {
    // Create new seller record with id = userId
    await prisma.$executeRaw`INSERT INTO "Seller" (id, "userId", "storeName", "kycStatus", "totalRevenue", "totalOrders", "createdAt", "updatedAt") VALUES (${sellerId}, ${sellerId}, ${`Store ${sellerId.slice(0, 8)}`}, 'PENDING', 0, 0, NOW(), NOW())`;
    actualSellerId = sellerId;
  }

  const { stockQuantity, ...data } = CreateProductDtoSchema.parse(req.body);
  
  const slugBase = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  let slug = slugBase;
  let counter = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${counter++}`;
  }

  const product = await prisma.product.create({
    data: {
      ...data,
      sellerId: actualSellerId,
      slug,
      status: ProductStatus.ACTIVE,
      inventory: {
        create: {
          sellerId: actualSellerId,
          quantity: stockQuantity ?? 1,
          reserved: 0,
          lowStockThreshold: 5,
        },
      },
    },
    include: { inventory: true },
  });
  res.status(201).json(product);
}));

// PATCH /api/products/:id - Update product
router.patch('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { stockQuantity, ...data } = UpdateProductDtoSchema.parse(req.body);
  const existingProduct = stockQuantity === undefined
    ? null
    : await prisma.product.findUnique({
        where: { id: req.params.id },
        include: { inventory: true },
      });

  if (stockQuantity !== undefined && !existingProduct) throw new NotFoundError('Product');
  if (
    stockQuantity !== undefined &&
    existingProduct?.inventory &&
    stockQuantity < existingProduct.inventory.reserved
  ) {
    throw new ValidationError('Stock quantity cannot be less than reserved stock');
  }

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...data,
      ...(stockQuantity !== undefined && existingProduct
        ? {
            inventory: {
              upsert: {
                create: {
                  sellerId: existingProduct.sellerId,
                  quantity: stockQuantity,
                  reserved: 0,
                  lowStockThreshold: 5,
                },
                update: { quantity: stockQuantity },
              },
            },
          }
        : {}),
    },
    include: { inventory: true },
  });
  res.json(product);
}));

// PATCH /api/products/:id/approve - Approve/Reject product (admin)
router.patch('/:id/approve', authMiddleware, asyncHandler(async (req, res) => {
  const { action } = req.body; // 'approve' or 'reject'
  const userRole = req.headers['x-user-role'] as string;
  
  if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
    throw new ValidationError('Admin access required');
  }

  const newStatus = action === 'approve' ? ProductStatus.ACTIVE : ProductStatus.REJECTED;
  
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { status: newStatus },
    include: { inventory: true },
  });
  
  res.json(product);
}));

// DELETE /api/products/:id - Delete product
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ message: 'Product deleted' });
}));

export { router as catalogRouter };