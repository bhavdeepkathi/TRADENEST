import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@tradenest.local' },
    update: {},
    create: {
      email: 'superadmin@tradenest.local',
      passwordHash: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isVerified: true,
      isActive: true,
    },
  });
  await prisma.superAdmin.upsert({
    where: { userId: superAdmin.id },
    update: {},
    create: { userId: superAdmin.id },
  });
  console.log('✅ Super admin created:', superAdmin.email);

  // Create Admin
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tradenest.local' },
    update: {},
    create: {
      email: 'admin@tradenest.local',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isVerified: true,
      isActive: true,
    },
  });
  await prisma.admin.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, level: 1 },
  });
  console.log('✅ Admin created:', admin.email);

  // Create test Customer
  const customerPassword = await bcrypt.hash('Customer@123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'customer@tradenest.local' },
    update: {},
    create: {
      email: 'customer@tradenest.local',
      passwordHash: customerPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+919876543210',
      role: 'CUSTOMER',
      isVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Test customer created:', customer.email);

  // Create test Seller
  const sellerPassword = await bcrypt.hash('Seller@123', 12);
  const sellerUser = await prisma.user.upsert({
    where: { email: 'seller@tradenest.local' },
    update: {},
    create: {
      email: 'seller@tradenest.local',
      passwordHash: sellerPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+919876543211',
      role: 'SELLER',
      isVerified: true,
      isActive: true,
    },
  });
  const seller = await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      storeName: 'TechStore India',
      gstin: '27AAECM1234F1Z5',
      kycStatus: 'APPROVED',
    },
  });
  console.log('✅ Test seller created:', sellerUser.email);

  // Create addresses for customer
  await prisma.address.upsert({
    where: { id: 'addr-home' },
    update: {},
    create: {
      id: 'addr-home',
      userId: customer.id,
      label: 'Home',
      line1: '123 Main Street',
      line2: 'Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'IN',
      isDefault: true,
    },
  });

  await prisma.address.upsert({
    where: { id: 'addr-office' },
    update: {},
    create: {
      id: 'addr-office',
      userId: customer.id,
      label: 'Office',
      line1: '456 Business Park',
      line2: 'Floor 5, Tower A',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'IN',
      isDefault: false,
    },
  });
  console.log('✅ Addresses created');

  // Create categories
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
    },
  });

  const audio = await prisma.category.upsert({
    where: { slug: 'audio' },
    update: {},
    create: {
      name: 'Audio',
      slug: 'audio',
      description: 'Headphones, speakers, and audio equipment',
      parentId: electronics.id,
    },
  });

  const wearables = await prisma.category.upsert({
    where: { slug: 'wearables' },
    update: {},
    create: {
      name: 'Wearables',
      slug: 'wearables',
      description: 'Smart watches and fitness trackers',
      parentId: electronics.id,
    },
  });

  const computing = await prisma.category.upsert({
    where: { slug: 'computing' },
    update: {},
    create: {
      name: 'Computing',
      slug: 'computing',
      description: 'Laptops, keyboards, and accessories',
      parentId: electronics.id,
    },
  });

  const fashion = await prisma.category.upsert({
    where: { slug: 'fashion' },
    update: {},
    create: {
      name: 'Fashion',
      slug: 'fashion',
      description: 'Clothing and accessories',
    },
  });

  const home = await prisma.category.upsert({
    where: { slug: 'home-garden' },
    update: {},
    create: {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home decor and garden supplies',
    },
  });
  console.log('✅ Categories created');

  // Create products
  const products = [
    {
      title: 'Premium Wireless Headphones',
      slug: 'premium-wireless-headphones',
      description: 'Experience crystal-clear sound with our premium wireless headphones. Featuring active noise cancellation, 30-hour battery life, and premium comfort.',
      price: 2999,
      mrp: 4999,
      categoryId: audio.id,
      sellerId: seller.id,
      tags: ['wireless', 'noise-cancelling', 'bluetooth', 'premium'],
      images: [
        'https://picsum.photos/seed/headphones1/600/600',
        'https://picsum.photos/seed/headphones2/600/600',
        'https://picsum.photos/seed/headphones3/600/600',
      ],
      status: 'ACTIVE',
    },
    {
      title: 'Smart Watch Series 5',
      slug: 'smart-watch-series-5',
      description: 'Stay connected with the latest smartwatch featuring health monitoring, GPS, and 7-day battery life.',
      price: 15999,
      mrp: 19999,
      categoryId: wearables.id,
      sellerId: seller.id,
      tags: ['smartwatch', 'fitness', 'gps', 'health'],
      images: [
        'https://picsum.photos/seed/watch1/600/600',
        'https://picsum.photos/seed/watch2/600/600',
      ],
      status: 'ACTIVE',
    },
    {
      title: 'Mechanical Keyboard RGB',
      slug: 'mechanical-keyboard-rgb',
      description: 'Professional mechanical keyboard with Cherry MX switches and customizable RGB lighting.',
      price: 4999,
      mrp: 6999,
      categoryId: computing.id,
      sellerId: seller.id,
      tags: ['mechanical', 'rgb', 'gaming', 'cherry-mx'],
      images: [
        'https://picsum.photos/seed/keyboard1/600/600',
      ],
      status: 'ACTIVE',
    },
    {
      title: 'Portable Bluetooth Speaker',
      slug: 'portable-bluetooth-speaker',
      description: 'Compact Bluetooth speaker with 360° sound and 12-hour playtime. Waterproof and durable.',
      price: 2499,
      mrp: 3499,
      categoryId: audio.id,
      sellerId: seller.id,
      tags: ['bluetooth', 'portable', 'waterproof', 'speaker'],
      images: [
        'https://picsum.photos/seed/speaker1/600/600',
      ],
      status: 'ACTIVE',
    },
    {
      title: 'Laptop Stand Aluminum',
      slug: 'laptop-stand-aluminum',
      description: 'Ergonomic aluminum laptop stand with adjustable height and angle. Compatible with all laptops up to 17 inches.',
      price: 1799,
      mrp: 2499,
      categoryId: computing.id,
      sellerId: seller.id,
      tags: ['laptop', 'stand', 'aluminum', 'ergonomic'],
      images: [
        'https://picsum.photos/seed/laptopstand1/600/600',
      ],
      status: 'ACTIVE',
    },
  ];

  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: productData,
    });

    // Create inventory
    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: {},
      create: {
        productId: product.id,
        sellerId: seller.id,
        quantity: Math.floor(Math.random() * 100) + 10,
        lowStockThreshold: 5,
      },
    });
  }
  console.log('✅ Products and inventory created');

  // Create coupons
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: '10% off on first order',
      type: 'PERCENT',
      value: 10,
      minOrder: 500,
      maxDiscount: 1000,
      startAt: new Date(),
      endAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      usageLimit: 1000,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'SAVE500' },
    update: {},
    create: {
      code: 'SAVE500',
      description: 'Flat ₹500 off on orders above ₹2999',
      type: 'FLAT',
      value: 500,
      minOrder: 2999,
      startAt: new Date(),
      endAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      usageLimit: 500,
    },
  });
  console.log('✅ Coupons created');

  // Create notification preferences for users
  for (const user of [superAdmin, admin, customer, sellerUser]) {
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
  }

  // Create wallet for customer
  await prisma.wallet.upsert({
    where: { userId: customer.id },
    update: {},
    create: { userId: customer.id, balance: 0 },
  });

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });