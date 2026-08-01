import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tradenest.local' },
    update: {},
    create: {
      email: 'admin@tradenest.local',
      passwordHash: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Super admin created:', admin.email);

  // Create test customer
  const customerPassword = await bcrypt.hash('Customer@123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@tradenest.local' },
    update: {},
    create: {
      email: 'customer@tradenest.local',
      passwordHash: customerPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'CUSTOMER',
      isVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Test customer created:', customer.email);

  // Create test seller
  const sellerPassword = await bcrypt.hash('Seller@123', 12);
  const seller = await prisma.user.upsert({
    where: { email: 'seller@tradenest.local' },
    update: {},
    create: {
      email: 'seller@tradenest.local',
      passwordHash: sellerPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'SELLER',
      isVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Test seller created:', seller.email);

  // Create addresses for customer
  await prisma.address.upsert({
    where: { id: 'addr-1' },
    update: {},
    create: {
      id: 'addr-1',
      userId: customer.id,
      label: 'Home',
      line1: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'IN',
      isDefault: true,
    },
  });

  await prisma.address.upsert({
    where: { id: 'addr-2' },
    update: {},
    create: {
      id: 'addr-2',
      userId: customer.id,
      label: 'Office',
      line1: '456 Business Park',
      line2: 'Floor 5',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'IN',
      isDefault: false,
    },
  });
  console.log('✅ Addresses created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });