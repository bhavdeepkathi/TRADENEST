import { Router } from 'express';
import { prisma } from '../../utils/prisma';
import { asyncHandler } from '../../middlewares/errorHandler';
import { ValidationError, NotFoundError } from '@tradenest/common';

const router = Router();

// GET /api/wishlist - Get current user's wishlist
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    throw new ValidationError('User ID not found in request');
  }

  // Ensure wishlist exists for user
  const wishlistRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "Wishlist" WHERE "userId" = ${userId} LIMIT 1
  `;

  let wishlistId: string;
  if (wishlistRows.length === 0) {
    const newId = 'wl_' + Math.random().toString(36).substring(2, 11);
    await prisma.$executeRaw`
      INSERT INTO "Wishlist" ("id", "userId", "updatedAt")
      VALUES (${newId}, ${userId}, NOW())
      ON CONFLICT ("userId") DO NOTHING
    `;
    const fetched = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Wishlist" WHERE "userId" = ${userId} LIMIT 1
    `;
    wishlistId = fetched[0]?.id || newId;
  } else {
    wishlistId = wishlistRows[0].id;
  }

  const itemsRows = await prisma.$queryRaw<Array<any>>`
    SELECT 
      wi."id",
      wi."productId",
      wi."createdAt",
      p."title",
      p."slug",
      p."brand",
      p."price",
      p."mrp",
      p."discountPercent",
      p."images",
      p."ratingAvg",
      p."reviewCount",
      p."status"
    FROM "WishlistItem" wi
    JOIN "Product" p ON p."id" = wi."productId"
    WHERE wi."wishlistId" = ${wishlistId} AND p."status" = 'ACTIVE'
    ORDER BY wi."createdAt" DESC
  `;

  const items = itemsRows.map((row) => ({
    id: row.id,
    productId: row.productId,
    createdAt: row.createdAt,
    product: {
      id: row.productId,
      title: row.title,
      slug: row.slug,
      brand: row.brand,
      price: Number(row.price),
      mrp: row.mrp ? Number(row.mrp) : null,
      discountPercent: row.discountPercent || 0,
      images: Array.isArray(row.images) ? row.images : [],
      ratingAvg: row.ratingAvg ? Number(row.ratingAvg) : null,
      reviewCount: row.reviewCount || 0,
      status: row.status,
    },
  }));

  res.json({
    id: wishlistId,
    userId,
    items,
    total: items.length,
  });
}));

// POST /api/wishlist/:productId - Add item to wishlist
router.post('/:productId', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    throw new ValidationError('User ID not found in request');
  }

  const { productId } = req.params;

  const productRows = await prisma.$queryRaw<Array<{ id: string; status: string }>>`
    SELECT "id", "status" FROM "Product" WHERE "id" = ${productId} LIMIT 1
  `;

  if (productRows.length === 0) {
    throw new NotFoundError('Product');
  }

  // Ensure wishlist exists
  const wishlistRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "Wishlist" WHERE "userId" = ${userId} LIMIT 1
  `;

  let wishlistId: string;
  if (wishlistRows.length === 0) {
    const newId = 'wl_' + Math.random().toString(36).substring(2, 11);
    await prisma.$executeRaw`
      INSERT INTO "Wishlist" ("id", "userId", "updatedAt")
      VALUES (${newId}, ${userId}, NOW())
      ON CONFLICT ("userId") DO NOTHING
    `;
    const fetched = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Wishlist" WHERE "userId" = ${userId} LIMIT 1
    `;
    wishlistId = fetched[0]?.id || newId;
  } else {
    wishlistId = wishlistRows[0].id;
  }

  // Upsert wishlist item
  const itemId = 'wli_' + Math.random().toString(36).substring(2, 11);
  await prisma.$executeRaw`
    INSERT INTO "WishlistItem" ("id", "wishlistId", "productId", "createdAt")
    VALUES (${itemId}, ${wishlistId}, ${productId}, NOW())
    ON CONFLICT ("wishlistId", "productId") DO NOTHING
  `;

  res.status(201).json({
    success: true,
    message: 'Product added to wishlist',
  });
}));

// DELETE /api/wishlist/:productId - Remove item from wishlist
router.delete('/:productId', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    throw new ValidationError('User ID not found in request');
  }

  const { productId } = req.params;

  await prisma.$executeRaw`
    DELETE FROM "WishlistItem"
    WHERE "wishlistId" IN (SELECT "id" FROM "Wishlist" WHERE "userId" = ${userId})
      AND "productId" = ${productId}
  `;

  res.json({ success: true, message: 'Item removed from wishlist' });
}));

// DELETE /api/wishlist - Clear entire wishlist
router.delete('/', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    throw new ValidationError('User ID not found in request');
  }

  await prisma.$executeRaw`
    DELETE FROM "WishlistItem"
    WHERE "wishlistId" IN (SELECT "id" FROM "Wishlist" WHERE "userId" = ${userId})
  `;

  res.json({ success: true, message: 'Wishlist cleared' });
}));

export { router as wishlistRouter };
