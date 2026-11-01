import { PrismaClient, ProductStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Comprehensive Marketplace Catalog Expansion...');

  // Ensure Admin & Verified Sellers exist
  const sellerPassword = await bcrypt.hash('Seller@123', 12);
  const sellerUser = await prisma.user.upsert({
    where: { email: 'seller@tradenest.local' },
    update: { isVerified: true, isActive: true },
    create: {
      email: 'seller@tradenest.local',
      passwordHash: sellerPassword,
      firstName: 'TradeNest',
      lastName: 'Official Retail',
      phone: '+91 98201 44892',
      role: 'SELLER',
      isVerified: true,
      isActive: true,
    },
  });

  const seller = await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    update: { kycStatus: 'APPROVED' },
    create: {
      userId: sellerUser.id,
      storeName: 'TradeNest Official SuperStore',
      gstin: '27AABCT3920F1Z4',
      kycStatus: 'APPROVED',
      rating: 4.8,
    },
  });
  console.log('✅ Verified Seller:', seller.storeName);

  // Ensure Delivery Partner Account exists in DB
  const deliveryPassword = await bcrypt.hash('Delivery@123', 12);
  const deliveryUser = await prisma.user.upsert({
    where: { email: 'delivery@tradenest.local' },
    update: { isVerified: true, isActive: true, role: 'DELIVERY_PARTNER' as any },
    create: {
      email: 'delivery@tradenest.local',
      passwordHash: deliveryPassword,
      firstName: 'Ramesh',
      lastName: 'Kumar',
      phone: '+91 98201 44892',
      role: 'DELIVERY_PARTNER' as any,
      isVerified: true,
      isActive: true,
    },
  });

  await prisma.deliveryPartner.upsert({
    where: { userId: deliveryUser.id },
    update: { isOnline: true },
    create: {
      userId: deliveryUser.id,
      vehicleType: 'Motorbike (MH-02-CD-4821)',
      vehicleNumber: 'MH-02-CD-4821',
      hubLocation: 'Mumbai Central Logistics Hub #04',
      phone: '+91 98201 44892',
      isOnline: true,
      totalDeliveries: 142,
      rating: 4.9,
    },
  });
  console.log('✅ Real Database Delivery Partner created:', deliveryUser.email);

  // Departments & Categories
  const categoriesDef = [
    { name: 'Mobiles & Tablets', slug: 'mobiles-tablets', description: 'Smartphones, Tablets, iPads and flagship devices' },
    { name: 'Computers & Laptops', slug: 'computers-laptops', description: 'Laptops, MacBooks, PC accessories and monitors' },
    { name: 'Electronics & Audio', slug: 'electronics-audio', description: 'Headphones, Soundbars, Smart TVs and Wearables' },
    { name: "Men's Fashion", slug: 'mens-fashion', description: "Jeans, T-shirts, Casual shirts, Loafers and Sneakers" },
    { name: "Women's Fashion", slug: 'womens-fashion', description: "Kurtas, Sarees, Dresses, Handbags and Heels" },
    { name: 'Kitchen & Dining', slug: 'kitchen-dining', description: 'Air Fryers, Induction Cooktops, Mixer Grinders, Flasks' },
    { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', description: 'Skincare Serums, Face Wash, Sunscreens, Mascaras' },
    { name: 'Home & Furniture', slug: 'home-furniture', description: 'Mattresses, Study Tables, Smart Bulbs, Vacuum Cleaners' },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoriesDef) {
    let record = await prisma.category.findFirst({ where: { OR: [{ slug: cat.slug }, { name: cat.name }] } });
    if (!record) {
      record = await prisma.category.create({ data: cat });
    }
    categoryMap.set(cat.slug, record.id);
  }
  console.log('✅ Category Taxonomy synced:', categoryMap.size);

  // Comprehensive Product Catalog (Amazon, Flipkart, Myntra, Meesho)
  const products = [
    // 1. SMARTPHONES & TABLETS
    {
      title: 'Apple iPhone 15 Pro Max (256 GB, Natural Titanium)',
      slug: 'apple-iphone-15-pro-max-256gb-natural-titanium',
      brand: 'Apple',
      categorySlug: 'mobiles-tablets',
      subcategory: 'Flagship Smartphones',
      price: 148900,
      mrp: 159900,
      discountPercent: 7,
      ratingAvg: 4.8,
      reviewCount: 942,
      tags: ['smartphone', 'iphone', 'apple', '5g', 'a17pro', 'titanium', 'camera'],
      images: [
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever with 5x optical zoom.',
      quantity: 45,
    },
    {
      title: 'Samsung Galaxy S24 Ultra 5G (512 GB, Titanium Gray, AI Enabled)',
      slug: 'samsung-galaxy-s24-ultra-5g-512gb-titanium-gray',
      brand: 'Samsung',
      categorySlug: 'mobiles-tablets',
      subcategory: 'Flagship Smartphones',
      price: 129999,
      mrp: 144999,
      discountPercent: 10,
      ratingAvg: 4.7,
      reviewCount: 685,
      tags: ['samsung', 'galaxy', 's24ultra', 'spen', 'galaxyai', '200mp', '5g'],
      images: [
        'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Meet Galaxy S24 Ultra with Galaxy AI. Search like never before, get real-time voice translation on calls, and capture breathtaking detail with 200MP camera and built-in S Pen.',
      quantity: 50,
    },
    {
      title: 'OnePlus 12 5G (16GB RAM, 512GB Storage, Silky Black)',
      slug: 'oneplus-12-5g-16gb-512gb-silky-black',
      brand: 'OnePlus',
      categorySlug: 'mobiles-tablets',
      subcategory: 'Flagship Smartphones',
      price: 64999,
      mrp: 69999,
      discountPercent: 7,
      ratingAvg: 4.6,
      reviewCount: 512,
      tags: ['oneplus', 'oneplus12', 'hasselblad', '100w', 'fastcharge', '5g'],
      images: [
        'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Powered by Snapdragon 8 Gen 3 with 4th Gen Hasselblad Camera System, 2K 120Hz ProXDR display, and 5400 mAh battery with 100W SUPERVOOC charging.',
      quantity: 60,
    },
    {
      title: 'Apple iPad Air (5th Gen, 10.9-inch Liquid Retina, M1 Chip, 64GB Wi-Fi)',
      slug: 'apple-ipad-air-5th-gen-m1-64gb-space-gray',
      brand: 'Apple',
      categorySlug: 'mobiles-tablets',
      subcategory: 'Tablets',
      price: 54990,
      mrp: 59900,
      discountPercent: 8,
      ratingAvg: 4.8,
      reviewCount: 420,
      tags: ['apple', 'ipad', 'm1', 'tablet', 'retina', 'applepencil'],
      images: [
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Supercharged by Apple M1 chip with 8-core CPU and 8-core GPU. 10.9-inch Liquid Retina display with True Tone, P3 wide color, and antireflective coating.',
      quantity: 35,
    },

    // 2. COMPUTERS & LAPTOPS
    {
      title: 'Apple MacBook Air M3 (13.6-inch Liquid Retina, 8GB Unified RAM, 256GB SSD, Space Gray)',
      slug: 'apple-macbook-air-m3-13-inch-space-gray',
      brand: 'Apple',
      categorySlug: 'computers-laptops',
      subcategory: 'Ultrabooks',
      price: 104900,
      mrp: 114900,
      discountPercent: 9,
      ratingAvg: 4.9,
      reviewCount: 780,
      tags: ['macbook', 'apple', 'm3', 'laptop', 'macos', 'ultrabook'],
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Lean. Mean. M3 machine. Built for Apple Intelligence with up to 18 hours of battery life, striking 1080p FaceTime HD camera, and backlit Magic Keyboard with Touch ID.',
      quantity: 30,
    },
    {
      title: 'ASUS ROG Zephyrus G16 Gaming Laptop (Intel Core Ultra 9, RTX 4070, 32GB RAM, 1TB SSD)',
      slug: 'asus-rog-zephyrus-g16-gaming-laptop-rtx4070',
      brand: 'ASUS',
      categorySlug: 'computers-laptops',
      subcategory: 'Gaming Laptops',
      price: 169990,
      mrp: 189990,
      discountPercent: 11,
      ratingAvg: 4.7,
      reviewCount: 310,
      tags: ['asus', 'rog', 'gaming', 'rtx4070', 'intel', 'oled', '1tb'],
      images: [
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Precision gaming power with 2.5K 240Hz OLED ROG Nebula display, CNC aluminum chassis, NVIDIA GeForce RTX 4070, and vapor chamber cooling.',
      quantity: 20,
    },
    {
      title: 'Logitech MX Master 3S Wireless Performance Mouse (Quiet Clicks, 8K DPI)',
      slug: 'logitech-mx-master-3s-wireless-mouse',
      brand: 'Logitech',
      categorySlug: 'computers-laptops',
      subcategory: 'Computer Accessories',
      price: 8995,
      mrp: 10995,
      discountPercent: 18,
      ratingAvg: 4.8,
      reviewCount: 1420,
      tags: ['logitech', 'mouse', 'wireless', 'ergonomic', 'mxmaster', 'bluetooth'],
      images: [
        'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'An icon remastered. MagSpeed electromagnetic scrolling, 8000 DPI track-on-glass sensor, quiet clicks, and ergonomic silhouette supporting your palm and wrist.',
      quantity: 110,
    },

    // 3. ELECTRONICS & AUDIO
    {
      title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones (Silver, 30hr Battery)',
      slug: 'sony-wh-1000xm5-wireless-noise-cancelling-silver',
      brand: 'Sony',
      categorySlug: 'electronics-audio',
      subcategory: 'Headphones',
      price: 28990,
      mrp: 34990,
      discountPercent: 17,
      ratingAvg: 4.8,
      reviewCount: 1250,
      tags: ['sony', 'headphones', 'noisecancelling', 'bluetooth', 'anc', 'wireless', 'audio'],
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Industry-leading noise cancellation optimized automatically by two processors and eight microphones. Crystal clear hands-free calling with Precise Voice Pickup Technology.',
      quantity: 65,
    },
    {
      title: 'Apple Watch Series 9 GPS 45mm (Midnight Aluminium with Sport Band)',
      slug: 'apple-watch-series-9-gps-45mm-midnight',
      brand: 'Apple',
      categorySlug: 'electronics-audio',
      subcategory: 'Smartwatches',
      price: 41900,
      mrp: 44900,
      discountPercent: 7,
      ratingAvg: 4.8,
      reviewCount: 680,
      tags: ['applewatch', 'smartwatch', 'fitness', 'heartrate', 'ecg', 'oled'],
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'The S9 chip enables a superbright display and a magical new Double Tap gesture to quickly interact with Apple Watch without touching the screen.',
      quantity: 55,
    },
    {
      title: 'Sony PlayStation 5 Console (Slim Disc Edition, 1TB SSD)',
      slug: 'sony-playstation-5-slim-disc-edition-1tb',
      brand: 'Sony',
      categorySlug: 'electronics-audio',
      subcategory: 'Gaming Consoles',
      price: 49990,
      mrp: 54990,
      discountPercent: 9,
      ratingAvg: 4.9,
      reviewCount: 1840,
      tags: ['ps5', 'playstation', 'gaming', 'console', '4k', 'dualsense'],
      images: [
        'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Experience lightning-fast loading with an ultra-high speed 1TB SSD, deeper immersion with haptic feedback, adaptive triggers, and 3D Audio.',
      quantity: 40,
    },

    // 4. MEN'S FASHION (MYNTRA & FLIPKART)
    {
      title: "Nike Air Force 1 '07 Men's Low-Top Sneakers (Triple White)",
      slug: 'nike-air-force-1-07-mens-triple-white',
      brand: 'Nike',
      categorySlug: 'mens-fashion',
      subcategory: 'Footwear & Sneakers',
      price: 8195,
      mrp: 9695,
      discountPercent: 15,
      ratingAvg: 4.8,
      reviewCount: 2100,
      tags: ['nike', 'sneakers', 'airforce1', 'shoes', 'casual', 'streetwear', 'white'],
      images: [
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'The radiance lives on in the Nike Air Force 1 07. Crossing hardwood comfort with off-court flair, this hoops original pairs crisp leather with iconic 80s construction.',
      quantity: 85,
    },
    {
      title: "Levi's Men 511 Slim Fit Mid-Rise Clean Dark Indigo Jeans",
      slug: 'levis-men-511-slim-fit-clean-indigo-jeans',
      brand: "Levi's",
      categorySlug: 'mens-fashion',
      subcategory: 'Jeans & Denim',
      price: 2399,
      mrp: 3199,
      discountPercent: 25,
      ratingAvg: 4.6,
      reviewCount: 920,
      tags: ['levis', 'jeans', 'denim', 'slimfit', 'pants', 'mensfashion'],
      images: [
        'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'A modern slim with room to move, the 511 Slim Fit Stretch Jeans are a classic since right now. These jeans sit below the waist with a slim leg from hip to ankle.',
      quantity: 120,
    },
    {
      title: 'Puma Unisex Smash V2 Low-Top Classic Leather Sneakers (Black & White)',
      slug: 'puma-unisex-smash-v2-classic-leather-sneakers',
      brand: 'Puma',
      categorySlug: 'mens-fashion',
      subcategory: 'Footwear & Sneakers',
      price: 2499,
      mrp: 4499,
      discountPercent: 44,
      ratingAvg: 4.5,
      reviewCount: 1650,
      tags: ['puma', 'sneakers', 'casual', 'shoes', 'leather', 'sportswear'],
      images: [
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Clean leather upper with Puma Formstrip on lateral sides, SoftFoam+ comfort sockliner for instant step-in and long-lasting cushioning.',
      quantity: 150,
    },
    {
      title: 'Fossil Grant Chronograph Brown Genuine Leather Watch (FS4735)',
      slug: 'fossil-grant-chronograph-brown-leather-watch',
      brand: 'Fossil',
      categorySlug: 'mens-fashion',
      subcategory: 'Watches',
      price: 9995,
      mrp: 13495,
      discountPercent: 26,
      ratingAvg: 4.7,
      reviewCount: 840,
      tags: ['fossil', 'watch', 'chronograph', 'leather', 'accessories', 'formal'],
      images: [
        'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Modeled after vintage clocks, Roman numeral markers grant artistic balance. Pair with polished business or relaxed weekend attire.',
      quantity: 60,
    },

    // 5. WOMEN'S FASHION (MYNTRA & MEESHO)
    {
      title: 'Libas Women Emerald Green Embroidered Silk Blend Kurta Set with Trousers & Dupatta',
      slug: 'libas-women-emerald-green-embroidered-kurta-set',
      brand: 'Libas',
      categorySlug: 'womens-fashion',
      subcategory: 'Ethnic Wear',
      price: 1799,
      mrp: 3999,
      discountPercent: 55,
      ratingAvg: 4.6,
      reviewCount: 1750,
      tags: ['kurta', 'ethnic', 'libas', 'womensfashion', 'embroidery', 'traditional', 'silk'],
      images: [
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Regal emerald green kurta set crafted in silk blend with intricate zari threadwork, paired with straight trousers and matching organza dupatta.',
      quantity: 130,
    },
    {
      title: 'Biba Women Maroon & Gold Foil Print Kalidar Anarkali Kurta',
      slug: 'biba-women-maroon-gold-foil-print-anarkali-kurta',
      brand: 'Biba',
      categorySlug: 'womens-fashion',
      subcategory: 'Ethnic Wear',
      price: 3299,
      mrp: 5995,
      discountPercent: 45,
      ratingAvg: 4.7,
      reviewCount: 1120,
      tags: ['anarkali', 'biba', 'ethnic', 'kurta', 'festive', 'traditional'],
      images: [
        'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Festive flare in premium rayon fabric with golden foil motifs, stylized tie-up dori with handcrafted tassels, and flared kalidar silhouette.',
      quantity: 90,
    },
    {
      title: 'Mokobara The Transit Backpack (Water-Resistant 21L, Hazelwood)',
      slug: 'mokobara-the-transit-backpack-hazelwood',
      brand: 'Mokobara',
      categorySlug: 'womens-fashion',
      subcategory: 'Bags & Luggage',
      price: 4499,
      mrp: 6999,
      discountPercent: 36,
      ratingAvg: 4.8,
      reviewCount: 780,
      tags: ['backpack', 'mokobara', 'travel', 'laptopbag', 'lifestyle'],
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Thoughtfully designed with vegan leather accents, dedicated 15.6-inch padded laptop pocket, luggage trolley sleeve, and magnetic quick-access stash.',
      quantity: 75,
    },

    // 6. KITCHEN & HOME APPLIANCES (AMAZON & FLIPKART)
    {
      title: 'Philips Digital Air Fryer HD9200 (Rapid Air Technology, 4.1L, 1400W)',
      slug: 'philips-digital-air-fryer-hd9200-rapid-air',
      brand: 'Philips',
      categorySlug: 'kitchen-dining',
      subcategory: 'Kitchen Appliances',
      price: 5499,
      mrp: 8995,
      discountPercent: 39,
      ratingAvg: 4.7,
      reviewCount: 2450,
      tags: ['airfryer', 'philips', 'kitchen', 'healthy', 'cooking', 'homeappliance'],
      images: [
        'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Fry with up to 90% less fat using patented Rapid Air Starfish design. 12-in-1 cooking functions including fry, bake, grill, roast and reheat.',
      quantity: 110,
    },
    {
      title: 'Pigeon by Stovekraft Cruise 1800W Induction Cooktop with 7 Pre-Set Menus',
      slug: 'pigeon-cruise-1800w-induction-cooktop',
      brand: 'Pigeon',
      categorySlug: 'kitchen-dining',
      subcategory: 'Kitchen Appliances',
      price: 1599,
      mrp: 3195,
      discountPercent: 50,
      ratingAvg: 4.4,
      reviewCount: 3100,
      tags: ['induction', 'pigeon', 'cooktop', 'kitchen', 'cooking', 'energy-efficient'],
      images: [
        'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'High-grade electrical induction cooktop with dual heat sensor technology, 7 Indian pre-set cooking menus, and automatic shut-off safety.',
      quantity: 180,
    },
    {
      title: 'Milton Thermosteel Flip Lid Insulated Stainless Steel Flask (1000ml, 24Hr Hot/Cold)',
      slug: 'milton-thermosteel-flip-lid-flask-1000ml',
      brand: 'Milton',
      categorySlug: 'kitchen-dining',
      subcategory: 'Bottles & Flasks',
      price: 999,
      mrp: 1345,
      discountPercent: 26,
      ratingAvg: 4.6,
      reviewCount: 4200,
      tags: ['flask', 'milton', 'thermosteel', 'bottle', 'kitchen', 'travel'],
      images: [
        'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Double walled vacuum insulation maintains temperature of hot and cold beverages for 24 hours. Rust-free 304 grade stainless steel.',
      quantity: 250,
    },
    {
      title: 'Dyson V12 Detect Slim Total Clean Cordless Vacuum Cleaner',
      slug: 'dyson-v12-detect-slim-cordless-vacuum',
      brand: 'Dyson',
      categorySlug: 'home-furniture',
      subcategory: 'Vacuum Cleaners',
      price: 52900,
      mrp: 59900,
      discountPercent: 12,
      ratingAvg: 4.9,
      reviewCount: 540,
      tags: ['dyson', 'vacuum', 'cleaning', 'cordless', 'homeappliance'],
      images: [
        'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Precisely-angled laser reveals invisible dust on hard floors. Acoustic piezo sensor counts and measures dust particles for intelligent suction control.',
      quantity: 25,
    },

    // 7. BEAUTY & PERSONAL CARE
    {
      title: 'Minimalist 10% Niacinamide Face Serum with Zinc for Acne Marks & Blemishes (30ml)',
      slug: 'minimalist-10-niacinamide-face-serum-30ml',
      brand: 'Minimalist',
      categorySlug: 'beauty-personal-care',
      subcategory: 'Skincare',
      price: 599,
      mrp: 699,
      discountPercent: 14,
      ratingAvg: 4.7,
      reviewCount: 3800,
      tags: ['skincare', 'minimalist', 'niacinamide', 'serum', 'acne', 'glow'],
      images: [
        'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1608248597359-54848ef946be?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'An aloe-based soothing face serum formulated with pure 10% Niacinamide and 1% Zinc PCA to visibly reduce dark spots, clear acne marks, and balance sebum.',
      quantity: 300,
    },
    {
      title: 'Cetaphil Gentle Skin Cleanser for Dry to Normal Sensitive Skin (500ml)',
      slug: 'cetaphil-gentle-skin-cleanser-500ml',
      brand: 'Cetaphil',
      categorySlug: 'beauty-personal-care',
      subcategory: 'Skincare',
      price: 945,
      mrp: 1250,
      discountPercent: 24,
      ratingAvg: 4.8,
      reviewCount: 2900,
      tags: ['cetaphil', 'facewash', 'cleanser', 'sensitive', 'skincare', 'dermatologist'],
      images: [
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Dermatologist recommended creamy formula with hydrating Glycerin, Vitamin B5 (Panthenol) and Vitamin B3 (Niacinamide) to preserve skin moisture barrier.',
      quantity: 210,
    },
    {
      title: 'Maybelline New York Lash Sensational Sky High Waterproof Mascara',
      slug: 'maybelline-lash-sensational-sky-high-mascara',
      brand: 'Maybelline',
      categorySlug: 'beauty-personal-care',
      subcategory: 'Cosmetics',
      price: 649,
      mrp: 799,
      discountPercent: 19,
      ratingAvg: 4.6,
      reviewCount: 2300,
      tags: ['mascara', 'maybelline', 'makeup', 'eyemakeup', 'beauty', 'cosmetics'],
      images: [
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Delivers full lash volume and limitless length with an exclusive Flex Tower mascara brush that bends to volumize and extend every single lash.',
      quantity: 190,
    },

    // 8. HOME & FURNITURE
    {
      title: 'Wakefit Orthopaedic Memory Foam Mattress (78x60 King Size, 6-inch High Resilience)',
      slug: 'wakefit-orthopaedic-memory-foam-mattress-king',
      brand: 'Wakefit',
      categorySlug: 'home-furniture',
      subcategory: 'Mattresses & Bedding',
      price: 11499,
      mrp: 17899,
      discountPercent: 36,
      ratingAvg: 4.8,
      reviewCount: 1680,
      tags: ['mattress', 'wakefit', 'memoryfoam', 'orthopaedic', 'bedroom', 'bedding'],
      images: [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Designed with differential pressure zones for spinal alignment. Next-generation memory foam adapts to body contours with a breathable zippered cover.',
      quantity: 45,
    },
    {
      title: 'Wipro 12W Smart LED B22 Bulb with 16 Million Colors & Music Sync',
      slug: 'wipro-12w-smart-led-bulb-b22',
      brand: 'Wipro',
      categorySlug: 'home-furniture',
      subcategory: 'Smart Lighting',
      price: 649,
      mrp: 1090,
      discountPercent: 40,
      ratingAvg: 4.5,
      reviewCount: 3200,
      tags: ['smartbulb', 'wipro', 'iot', 'lighting', 'alexa', 'homeautomation'],
      images: [
        'https://images.unsplash.com/photo-1550985543-f47f38aeee65?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Transform your home with 16 million colors, tuneable white (2700K to 6500K), group scheduling, and music rhythm sync with Alexa and Google Assistant.',
      quantity: 320,
    },
    {
      title: 'Noise ColorFit Pulse 3 Bluetooth Calling Smart Watch (1.96" TFT Display, 7-Day Battery)',
      slug: 'noise-colorfit-pulse-3-smart-watch',
      brand: 'Noise',
      categorySlug: 'electronics-audio',
      subcategory: 'Smartwatches',
      price: 1499,
      mrp: 4999,
      discountPercent: 70,
      ratingAvg: 4.4,
      reviewCount: 4500,
      tags: ['noise', 'smartwatch', 'bluetoothcalling', 'fitness', 'wearable'],
      images: [
        'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=1000&q=80',
      ],
      description: 'Mega 1.96-inch TFT display with 550 nits brightness, Tru Sync Bluetooth calling with quick dialpad, 100+ sports modes, and 24/7 heart rate monitor.',
      quantity: 280,
    },
  ];

  let addedCount = 0;
  for (const item of products) {
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) continue;

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        brand: item.brand,
        subcategory: item.subcategory,
        price: item.price,
        mrp: item.mrp,
        discountPercent: item.discountPercent,
        images: item.images,
        tags: item.tags,
        description: item.description,
        ratingAvg: item.ratingAvg,
        reviewCount: item.reviewCount,
        status: ProductStatus.ACTIVE,
      },
      create: {
        sellerId: seller.id,
        categoryId: categoryId,
        title: item.title,
        slug: item.slug,
        brand: item.brand,
        subcategory: item.subcategory,
        price: item.price,
        mrp: item.mrp,
        discountPercent: item.discountPercent,
        images: item.images,
        tags: item.tags,
        description: item.description,
        status: ProductStatus.ACTIVE,
        ratingAvg: item.ratingAvg,
        reviewCount: item.reviewCount,
      },
    });

    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: {
        quantity: item.quantity,
        reserved: 0,
      },
      create: {
        productId: product.id,
        sellerId: seller.id,
        quantity: item.quantity,
        reserved: 0,
        lowStockThreshold: 5,
      },
    });

    addedCount++;
    console.log(`  ✓ Synced product [${item.brand}]: ${item.title.slice(0, 45)}... (₹${item.price.toLocaleString('en-IN')})`);
  }

  console.log(`\n🎉 Successfully seeded ${addedCount} real Amazon, Flipkart, Myntra & Meesho products into TRADENEST PostgreSQL!`);
}

main()
  .catch((e) => {
    console.error('❌ Error during product seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
