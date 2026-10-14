import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { asyncHandler } from '../../middlewares/errorHandler';
import { NotFoundError, ValidationError } from '@tradenest/common';
import { ProductQuerySchema, CreateProductDtoSchema, UpdateProductDtoSchema, ProductStatus } from '@tradenest/common';

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
  if (sellerId) where.sellerId = sellerId;
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

// POST /api/products - Create product (seller)
router.post('/', asyncHandler(async (req, res) => {
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

  const data = CreateProductDtoSchema.parse(req.body);
  
  const slugBase = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  let slug = slugBase;
  let counter = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${counter++}`;
  }

  const product = await prisma.product.create({
    data: { ...data, sellerId: actualSellerId, slug, status: ProductStatus.PENDING_APPROVAL },
  });
  res.status(201).json(product);
}));

// PATCH /api/products/:id - Update product
router.patch('/:id', asyncHandler(async (req, res) => {
  const data = UpdateProductDtoSchema.parse(req.body);
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data,
  });
  res.json(product);
}));

// DELETE /api/products/:id - Delete product
router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ message: 'Product deleted' });
}));

export { router as catalogRouter };