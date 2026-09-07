import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️ Deleting existing products and related data...');
  
  await prisma.aIRecommendation.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  
  console.log('✅ All products and categories deleted');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Deletion failed:', e);
  process.exit(1);
});