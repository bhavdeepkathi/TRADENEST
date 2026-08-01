import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import { asyncHandler } from '../../middlewares/errorHandler';
import { NotFoundError, ValidationError } from '@tradenest/common';
import { CreateCategoryDtoSchema } from '@tradenest/common';

const router = Router();

function validate(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) throw new ValidationError('Invalid request data', result.error.flatten().fieldErrors);
    req.body = result.data;
    next();
  };
}

function generateSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// GET /api/categories - List all categories (tree structure)
router.get('/', asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        include: { children: true },
        orderBy: { name: 'asc' },
      },
      _count: { select: { products: { where: { status: 'ACTIVE' } } } },
    },
    orderBy: { name: 'asc' },
  });
  res.json(categories);
}));

// GET /api/categories/:id - Get category with products
router.get('/:id', asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: {
      parent: true,
      children: true,
      products: {
        where: { status: 'ACTIVE' },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { inventory: true },
      },
    },
  });
  if (!category) throw new NotFoundError('Category');
  res.json(category);
}));

// POST /api/categories - Create category (admin)
router.post('/', asyncHandler(async (req, res) => {
  const data = CreateCategoryDtoSchema.parse(req.body);
  const slug = data.slug || generateSlug(data.name);
  
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) throw new ValidationError('Category with this slug already exists');

  const category = await prisma.category.create({ data: { ...data, slug } });
  res.status(201).json(category);
}));

// PATCH /api/categories/:id - Update category
router.patch('/:id', asyncHandler(async (req, res) => {
  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(category);
}));

// DELETE /api/categories/:id - Delete category
router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ message: 'Category deleted' });
}));

export { router as categoryRouter };