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
  const { page, limit, sort, order, q, categoryId, sellerId, minPrice, maxPrice, rating, status, inStock } = query;

  const where: any = {};
  if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }];
  if (categoryId) where.categoryId = categoryId;
  if (sellerId) where.sellerId = sellerId;
  if (minPrice || maxPrice) where.price = { ...(minPrice && { gte: minPrice }), ...(maxPrice && { lte: maxPrice }) };
  if (rating) where.ratingAvg = { gte: rating };
  if (status) where.status = status;
  else where.status = ProductStatus.ACTIVE;

  if (inStock) {
    where.inventory = { quantity: { gt: 0 } };
  }

  const orderBy: any = sort ? { [sort]: order } : { createdAt: 'desc' };

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
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      inventory: true,
      reviews: { take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, firstName: true, lastName: true } } } },
    },
  });
  if (!product) throw new NotFoundError('Product');
  res.json(product);
}));

// POST /api/products - Create product (seller)
router.post('/', asyncHandler(async (req, res) => {
  // In real implementation, get sellerId from auth
  const sellerId = 'seller-id-from-auth';
  const data = CreateProductDtoSchema.parse(req.body);
  
  const slugBase = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  let slug = slugBase;
  let counter = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${counter++}`;
  }

  const product = await prisma.product.create({
    data: { ...data, sellerId, slug, status: ProductStatus.PENDING_APPROVAL },
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