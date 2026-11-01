import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UniqueProduct {
  title: string;
  slug: string;
  brand: string;
  categorySlug: string;
  subcategory: string;
  price: number;
  mrp: number;
  discountPercent: number;
  ratingAvg: number;
  reviewCount: number;
  images: string[];
  description: string;
  tags: string[];
  quantity: number;
}

const PRODUCTS: UniqueProduct[] = [
  // 1. SMARTPHONES & TABLETS
  {
    title: 'Apple iPhone 15 Pro Max (256 GB, Natural Titanium)',
    slug: 'apple-iphone-15-pro-max-256gb-natural-titanium-clean',
    brand: 'Apple',
    categorySlug: 'mobiles-tablets',
    subcategory: 'Flagship Smartphones',
    price: 148900,
    mrp: 159900,
    discountPercent: 7,
    ratingAvg: 4.8,
    reviewCount: 942,
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Forged in titanium with the A17 Pro chip, Action button, and 5x telephoto optical zoom camera.',
    tags: ['apple', 'iphone', '5g', 'flagship', 'smartphone'],
    quantity: 40,
  },
  {
    title: 'Samsung Galaxy S24 Ultra 5G (512 GB, Titanium Gray)',
    slug: 'samsung-galaxy-s24-ultra-5g-512gb-gray-clean',
    brand: 'Samsung',
    categorySlug: 'mobiles-tablets',
    subcategory: 'Flagship Smartphones',
    price: 129999,
    mrp: 144999,
    discountPercent: 10,
    ratingAvg: 4.7,
    reviewCount: 820,
    images: [
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Galaxy AI suite, built-in S Pen, 200MP Quad Telephoto camera, and Snapdragon 8 Gen 3 for Galaxy.',
    tags: ['samsung', 'galaxy', 's24ultra', 'android', 'spen'],
    quantity: 35,
  },
  {
    title: 'OnePlus 12 5G (16GB RAM, 512GB Storage, Flowy Emerald)',
    slug: 'oneplus-12-5g-16gb-512gb-emerald-clean',
    brand: 'OnePlus',
    categorySlug: 'mobiles-tablets',
    subcategory: 'Flagship Smartphones',
    price: 64999,
    mrp: 69999,
    discountPercent: 7,
    ratingAvg: 4.6,
    reviewCount: 520,
    images: [
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Snapdragon 8 Gen 3, 4th Gen Hasselblad Camera, 2K 120Hz ProXDR display, and 100W SUPERVOOC charging.',
    tags: ['oneplus', 'oneplus12', 'hasselblad', 'fastcharging'],
    quantity: 50,
  },
  {
    title: 'Google Pixel 8 Pro (128 GB, Bay Blue)',
    slug: 'google-pixel-8-pro-128gb-bay-blue-clean',
    brand: 'Google',
    categorySlug: 'mobiles-tablets',
    subcategory: 'Flagship Smartphones',
    price: 93999,
    mrp: 106999,
    discountPercent: 12,
    ratingAvg: 4.5,
    reviewCount: 380,
    images: [
      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Google Tensor G3 chip, fully upgraded Pro cameras with Magic Editor, and 7 years of OS updates.',
    tags: ['google', 'pixel', 'android', 'camera', 'tensor'],
    quantity: 30,
  },
  {
    title: 'Apple iPad Air 11-inch M2 (128GB, Starlight, Wi-Fi)',
    slug: 'apple-ipad-air-11-inch-m2-128gb-starlight-clean',
    brand: 'Apple',
    categorySlug: 'mobiles-tablets',
    subcategory: 'Tablets & iPads',
    price: 57900,
    mrp: 59900,
    discountPercent: 3,
    ratingAvg: 4.8,
    reviewCount: 310,
    images: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Incredible performance with Apple M2 chip, Liquid Retina display, landscape 12MP front camera, and Apple Pencil Pro support.',
    tags: ['apple', 'ipad', 'm2', 'tablet', 'applepencil'],
    quantity: 45,
  },

  // 2. COMPUTERS & LAPTOPS
  {
    title: 'Apple MacBook Air 13.6-inch M3 Chip (16GB Unified Memory, 512GB SSD, Midnight)',
    slug: 'apple-macbook-air-13-m3-16gb-512gb-midnight-clean',
    brand: 'Apple',
    categorySlug: 'computers-laptops',
    subcategory: 'Laptops',
    price: 134900,
    mrp: 144900,
    discountPercent: 7,
    ratingAvg: 4.9,
    reviewCount: 412,
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Supercharged by M3 chip, up to 18 hours of battery life, Liquid Retina display with 500 nits brightness, and silent fanless design.',
    tags: ['apple', 'macbook', 'm3', 'laptop', 'macos'],
    quantity: 25,
  },
  {
    title: 'Dell XPS 13 Plus 9320 Laptop (13th Gen Intel Core i7-1360P, 16GB, 1TB SSD, OLED)',
    slug: 'dell-xps-13-plus-i7-16gb-1tb-oled-clean',
    brand: 'Dell',
    categorySlug: 'computers-laptops',
    subcategory: 'Premium Laptops',
    price: 169990,
    mrp: 198990,
    discountPercent: 15,
    ratingAvg: 4.6,
    reviewCount: 154,
    images: [
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Edge-to-edge glass touchpad, capacitive touch function row, 3.5K OLED InfinityEdge touch screen, and CNC machined aluminum.',
    tags: ['dell', 'xps', 'intel', 'windows11', 'oled'],
    quantity: 20,
  },
  {
    title: 'HP Pavilion 15 (13th Gen Intel Core i5-1335U, 16GB RAM, 512GB SSD, FHD)',
    slug: 'hp-pavilion-15-i5-13th-gen-16gb-512gb-clean',
    brand: 'HP',
    categorySlug: 'computers-laptops',
    subcategory: 'Laptops',
    price: 64990,
    mrp: 78990,
    discountPercent: 18,
    ratingAvg: 4.4,
    reviewCount: 650,
    images: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Micro-edge FHD anti-glare display, Audio by B&O, fast charge, backlit keyboard, and pre-loaded Windows 11 + MS Office.',
    tags: ['hp', 'pavilion', 'laptop', 'intel', 'office'],
    quantity: 60,
  },
  {
    title: 'Lenovo ThinkPad X1 Carbon Gen 11 (Intel Core i7-1365U, 32GB RAM, 1TB SSD)',
    slug: 'lenovo-thinkpad-x1-carbon-gen-11-clean',
    brand: 'Lenovo',
    categorySlug: 'computers-laptops',
    subcategory: 'Business Laptops',
    price: 189990,
    mrp: 224990,
    discountPercent: 16,
    ratingAvg: 4.8,
    reviewCount: 120,
    images: [
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Legendary carbon-fiber chassis, legendary TrackPoint keyboard, Intel vPro enterprise security, and 2.8K OLED display.',
    tags: ['lenovo', 'thinkpad', 'business', 'enterprise', 'ultrabook'],
    quantity: 15,
  },
  {
    title: 'Logitech MX Master 3S Wireless Performance Mouse (Quiet Clicks, 8K DPI)',
    slug: 'logitech-mx-master-3s-mouse-clean',
    brand: 'Logitech',
    categorySlug: 'computers-laptops',
    subcategory: 'Computer Accessories',
    price: 8995,
    mrp: 10995,
    discountPercent: 18,
    ratingAvg: 4.8,
    reviewCount: 1840,
    images: [
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1000&q=80',
    ],
    description: '8000 DPI track-on-glass sensor, MagSpeed electromagnetic scrolling, 90% quieter clicks, and USB-C quick charge.',
    tags: ['logitech', 'mouse', 'wireless', 'ergonomic', 'mxmaster'],
    quantity: 80,
  },

  // 3. AUDIO & HEADPHONES
  {
    title: 'Sony WH-1000XM5 Wireless Industry Leading Noise Cancelling Headphones (Silver)',
    slug: 'sony-wh-1000xm5-wireless-anc-headphones-silver-clean',
    brand: 'Sony',
    categorySlug: 'electronics-audio',
    subcategory: 'Headphones',
    price: 29990,
    mrp: 34990,
    discountPercent: 14,
    ratingAvg: 4.7,
    reviewCount: 1420,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Two processors and 8 microphones for unprecedented noise cancellation, ultra-clear hands-free calling, and 30-hour battery life.',
    tags: ['sony', 'anc', 'headphones', 'bluetooth', 'hires'],
    quantity: 50,
  },
  {
    title: 'Bose QuietComfort Ultra Wireless Noise Cancelling Headphones (Black)',
    slug: 'bose-quietcomfort-ultra-headphones-black-clean',
    brand: 'Bose',
    categorySlug: 'electronics-audio',
    subcategory: 'Headphones',
    price: 35900,
    mrp: 39900,
    discountPercent: 10,
    ratingAvg: 4.7,
    reviewCount: 480,
    images: [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'World-class active noise cancellation with groundbreaking Spatial Audio and CustomTune technology for sound shaped to your ears.',
    tags: ['bose', 'quietcomfort', 'anc', 'audiophile'],
    quantity: 35,
  },
  {
    title: 'Apple AirPods Pro 2nd Gen with USB-C MagSafe Case',
    slug: 'apple-airpods-pro-2nd-gen-usbc-clean',
    brand: 'Apple',
    categorySlug: 'electronics-audio',
    subcategory: 'Earbuds',
    price: 21900,
    mrp: 24900,
    discountPercent: 12,
    ratingAvg: 4.8,
    reviewCount: 2210,
    images: [
      'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Up to 2x more Active Noise Cancellation, Adaptive Audio, Personalized Spatial Audio, and precision finding with U1 chip.',
    tags: ['apple', 'airpods', 'tws', 'anc', 'wireless'],
    quantity: 70,
  },
  {
    title: 'Marshall Stanmore III Bluetooth Home Speaker (Black)',
    slug: 'marshall-stanmore-iii-bluetooth-speaker-clean',
    brand: 'Marshall',
    categorySlug: 'electronics-audio',
    subcategory: 'Speakers',
    price: 31999,
    mrp: 34999,
    discountPercent: 9,
    ratingAvg: 4.8,
    reviewCount: 340,
    images: [
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Home-filling Marshall signature sound with outward-angled tweeters, Bluetooth 5.2, and iconic vintage brass controls.',
    tags: ['marshall', 'speaker', 'bluetooth', 'vintage', 'bass'],
    quantity: 25,
  },
  {
    title: 'boAt Airdopes 141 ANC TWS Earbuds (42h Playtime, 32dB ANC)',
    slug: 'boat-airdopes-141-anc-earbuds-clean',
    brand: 'boAt',
    categorySlug: 'electronics-audio',
    subcategory: 'Earbuds',
    price: 1499,
    mrp: 4490,
    discountPercent: 67,
    ratingAvg: 4.2,
    reviewCount: 8450,
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Active Noise Cancellation up to 32dB, ENx tech for crystal clear calls, BEAST low latency mode, and ASAP charge.',
    tags: ['boat', 'airdopes', 'earbuds', 'budget', 'anc'],
    quantity: 150,
  },

  // 4. GAMING
  {
    title: 'Sony PlayStation 5 Slim 1TB Console (Disc Edition)',
    slug: 'sony-ps5-slim-1tb-disc-console-clean',
    brand: 'Sony PlayStation',
    categorySlug: 'gaming',
    subcategory: 'Gaming Consoles',
    price: 54990,
    mrp: 54990,
    discountPercent: 0,
    ratingAvg: 4.9,
    reviewCount: 1650,
    images: [
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Slimmer design with 1TB SSD storage, ultra-fast loading, haptic feedback, adaptive triggers, and 3D Audio.',
    tags: ['ps5', 'playstation', 'console', 'sony', 'gaming'],
    quantity: 40,
  },
  {
    title: 'Logitech G502 HERO High Performance Wired Gaming Mouse (25K Sensor)',
    slug: 'logitech-g502-hero-gaming-mouse-clean',
    brand: 'Logitech G',
    categorySlug: 'gaming',
    subcategory: 'Gaming Accessories',
    price: 3995,
    mrp: 5495,
    discountPercent: 27,
    ratingAvg: 4.7,
    reviewCount: 4120,
    images: [
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'HERO 25K optical sensor, 11 programmable buttons, adjustable weights, and customizable LIGHTSYNC RGB lighting.',
    tags: ['logitech', 'g502', 'gamingmouse', 'esports', 'rgb'],
    quantity: 90,
  },

  // 5. KITCHEN APPLIANCES & COOKWARE
  {
    title: 'Philips Digital Air Fryer HD9252/90 (4.1 Litre, Rapid Air Tech, 7 Presets)',
    slug: 'philips-digital-air-fryer-hd9252-clean',
    brand: 'Philips',
    categorySlug: 'kitchen-appliances',
    subcategory: 'Air Fryers',
    price: 6999,
    mrp: 11995,
    discountPercent: 42,
    ratingAvg: 4.6,
    reviewCount: 3120,
    images: [
      'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Patented Rapid Air technology cooks delicious food with up to 90% less fat. Features 7 touch screen presets and keep-warm mode.',
    tags: ['philips', 'airfryer', 'kitchen', 'healthy', 'cooking'],
    quantity: 65,
  },
  {
    title: 'Dyson V12 Detect Slim Total Clean Cordless Vacuum Cleaner',
    slug: 'dyson-v12-detect-slim-cordless-vacuum-clean',
    brand: 'Dyson',
    categorySlug: 'home-furniture',
    subcategory: 'Vacuum Cleaners',
    price: 52900,
    mrp: 65900,
    discountPercent: 20,
    ratingAvg: 4.8,
    reviewCount: 420,
    images: [
      'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Laser reveals invisible microscopic dust on hard floors, piezo sensor measures dust particles, and single-button power control.',
    tags: ['dyson', 'vacuum', 'cleaning', 'cordless', 'home'],
    quantity: 25,
  },
  {
    title: 'Pigeon Cruise 1800W Induction Cooktop with 7 Segment LED Display',
    slug: 'pigeon-cruise-1800w-induction-cooktop-clean',
    brand: 'Pigeon',
    categorySlug: 'kitchen-appliances',
    subcategory: 'Cooktops',
    price: 1599,
    mrp: 3195,
    discountPercent: 50,
    ratingAvg: 4.3,
    reviewCount: 9800,
    images: [
      'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Energy-saving 1800W induction plate with smart auto shut-off, micro-crystal plate, and preset Indian cooking menus.',
    tags: ['pigeon', 'induction', 'cooktop', 'kitchen'],
    quantity: 120,
  },
  {
    title: 'Milton Thermosteel Flip Lid Stainless Steel Flask (1000 ml)',
    slug: 'milton-thermosteel-flask-1000ml-clean',
    brand: 'Milton',
    categorySlug: 'kitchen-dining',
    subcategory: 'Flasks & Bottles',
    price: 999,
    mrp: 1220,
    discountPercent: 18,
    ratingAvg: 4.6,
    reviewCount: 14200,
    images: [
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Double wall vacuum insulation keeps beverages hot or cold for 24 hours. Fabricated inside and out in 18/8 rust-free stainless steel.',
    tags: ['milton', 'flask', 'thermosteel', 'bottle', 'water'],
    quantity: 200,
  },

  // 6. FASHION & FOOTWEAR
  {
    title: "Nike Men's Air Force 1 '07 Sneakers (Triple White)",
    slug: 'nike-air-force-1-07-triple-white-clean',
    brand: 'Nike',
    categorySlug: 'men-s-fashion',
    subcategory: 'Footwear',
    price: 8195,
    mrp: 9695,
    discountPercent: 15,
    ratingAvg: 4.8,
    reviewCount: 2300,
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'The basketball icon that puts a fresh spin on what you know best: stitched overlays, crisp leather, and the right amount of flash.',
    tags: ['nike', 'sneakers', 'airforce1', 'shoes', 'mensfashion'],
    quantity: 60,
  },
  {
    title: "Levi's Men's 511 Slim Fit Stretch Denim Jeans (Dark Indigo)",
    slug: 'levis-511-slim-fit-stretch-jeans-clean',
    brand: "Levi's",
    categorySlug: 'men-s-fashion',
    subcategory: 'Jeans & Denim',
    price: 2199,
    mrp: 3599,
    discountPercent: 39,
    ratingAvg: 4.5,
    reviewCount: 4210,
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'A modern slim with room to move. Added stretch provides all-day comfort. Cut close to the body without being tight.',
    tags: ['levis', 'jeans', 'denim', '511', 'slimfit'],
    quantity: 80,
  },
  {
    title: 'Biba Women Pure Cotton Anarkali Kurta & Dupatta Set (Teal Blue)',
    slug: 'biba-women-cotton-anarkali-kurta-dupatta-clean',
    brand: 'Biba',
    categorySlug: 'women-s-fashion',
    subcategory: 'Ethnic Wear',
    price: 2199,
    mrp: 4599,
    discountPercent: 52,
    ratingAvg: 4.6,
    reviewCount: 1890,
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Intricately printed pure cotton flared anarkali kurta paired with matching palazzo pants and lightweight chiffon dupatta.',
    tags: ['biba', 'anarkali', 'ethnicwear', 'kurta', 'traditional'],
    quantity: 75,
  },
  {
    title: 'Mokobara The Transit Backpack (22L Water-Resistant)',
    slug: 'mokobara-the-transit-backpack-22l-clean',
    brand: 'Mokobara',
    categorySlug: 'travel-luggage',
    subcategory: 'Backpacks',
    price: 4499,
    mrp: 6999,
    discountPercent: 36,
    ratingAvg: 4.7,
    reviewCount: 920,
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Engineered for seamless everyday transit with a 15.6-inch padded laptop sleeve, vegan leather accents, and luggage strap.',
    tags: ['mokobara', 'backpack', 'travel', 'laptopbag', 'commute'],
    quantity: 45,
  },

  // 7. BEAUTY & SKINCARE
  {
    title: 'Minimalist 10% Niacinamide Face Serum with Zinc for Blemish & Oil Control (30 ml)',
    slug: 'minimalist-10-niacinamide-serum-30ml-clean',
    brand: 'Minimalist',
    categorySlug: 'beauty-personal-care',
    subcategory: 'Face Serums',
    price: 569,
    mrp: 599,
    discountPercent: 5,
    ratingAvg: 4.6,
    reviewCount: 12400,
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Nourishing daily serum packed with pure 10% Vitamin B3 (Niacinamide) and 1% Zinc to soothe acne redness, regulate sebum, and reduce dark spots.',
    tags: ['minimalist', 'niacinamide', 'serum', 'skincare', 'acne'],
    quantity: 180,
  },
  {
    title: 'Cetaphil Gentle Skin Cleanser for Dry to Normal Sensitive Skin (250 ml)',
    slug: 'cetaphil-gentle-skin-cleanser-250ml-clean',
    brand: 'Cetaphil',
    categorySlug: 'beauty-personal-care',
    subcategory: 'Face Wash & Cleansers',
    price: 545,
    mrp: 610,
    discountPercent: 11,
    ratingAvg: 4.7,
    reviewCount: 24500,
    images: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Dermatologist recommended non-foaming gentle cleansing formula that hydrates as it cleans to protect the skin barrier.',
    tags: ['cetaphil', 'facewash', 'cleanser', 'sensitiveskin', 'skincare'],
    quantity: 210,
  },

  // 8. HOME & LIVING
  {
    title: 'Wakefit Orthopedic Memory Foam 6-inch King Size Mattress (78x72)',
    slug: 'wakefit-orthopedic-memory-foam-king-mattress-clean',
    brand: 'Wakefit',
    categorySlug: 'home-furniture',
    subcategory: 'Mattresses',
    price: 11999,
    mrp: 18499,
    discountPercent: 35,
    ratingAvg: 4.6,
    reviewCount: 7890,
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Targeted spine alignment with NextGen orthopedic memory foam and high resilience base. Includes 10-year manufacturer warranty.',
    tags: ['wakefit', 'mattress', 'memoryfoam', 'orthopedic', 'bedding'],
    quantity: 30,
  },
  {
    title: 'Wipro 12W Smart WiFi LED Bulb B22 with 16 Million Colors',
    slug: 'wipro-12w-smart-wifi-led-bulb-b22-clean',
    brand: 'Wipro',
    categorySlug: 'home-kitchen',
    subcategory: 'Smart Lighting',
    price: 599,
    mrp: 1299,
    discountPercent: 54,
    ratingAvg: 4.4,
    reviewCount: 15400,
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Control from anywhere via Wipro Next Smart Home App. Compatible with Amazon Alexa and Google Assistant with music rhythm sync.',
    tags: ['wipro', 'smartbulb', 'led', 'alexa', 'smarthome'],
    quantity: 160,
  },

  // 9. TOYS & GAMES
  {
    title: 'LEGO Classic Medium Creative Brick Box 10696 (484 Pieces)',
    slug: 'lego-classic-medium-brick-box-10696-clean',
    brand: 'LEGO',
    categorySlug: 'toys-games',
    subcategory: 'Building Blocks',
    price: 2499,
    mrp: 3499,
    discountPercent: 29,
    ratingAvg: 4.8,
    reviewCount: 4200,
    images: [
      'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Features a wide range of LEGO bricks in 35 different colors. Includes windows, eyes, wheels, and a storage tub for infinite building.',
    tags: ['lego', 'toys', 'buildingblocks', 'kids', 'creative'],
    quantity: 70,
  },
  {
    title: 'Hasbro Gaming Monopoly Deluxe Electronic Banking Board Game',
    slug: 'hasbro-monopoly-electronic-banking-game-clean',
    brand: 'Hasbro',
    categorySlug: 'toys-games',
    subcategory: 'Board Games',
    price: 1899,
    mrp: 2499,
    discountPercent: 24,
    ratingAvg: 4.7,
    reviewCount: 2900,
    images: [
      'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Fast-dealing property trading game with electronic banking unit and personalized banking cards instead of paper cash.',
    tags: ['hasbro', 'monopoly', 'boardgame', 'familygame'],
    quantity: 50,
  },

  // 10. BESTSELLER BOOKS
  {
    title: 'Atomic Habits by James Clear (Paperback Edition)',
    slug: 'atomic-habits-james-clear-paperback-clean',
    brand: 'Penguin',
    categorySlug: 'books',
    subcategory: 'Self-Help',
    price: 499,
    mrp: 799,
    discountPercent: 38,
    ratingAvg: 4.9,
    reviewCount: 38900,
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones. Over 15 million copies sold worldwide.',
    tags: ['book', 'atomichabits', 'jamesclear', 'selfhelp', 'bestseller'],
    quantity: 140,
  },
  {
    title: 'The Psychology of Money by Morgan Housel (Paperback)',
    slug: 'the-psychology-of-money-morgan-housel-clean',
    brand: 'Jaico Publishing',
    categorySlug: 'books',
    subcategory: 'Personal Finance',
    price: 349,
    mrp: 499,
    discountPercent: 30,
    ratingAvg: 4.8,
    reviewCount: 28400,
    images: [
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Timeless lessons on wealth, greed, and happiness doing well with money isn\'t necessarily about what you know. It\'s about how you behave.',
    tags: ['book', 'finance', 'investing', 'money', 'bestseller'],
    quantity: 120,
  },

  // 11. GROCERY & PANTRY
  {
    title: 'Tata Tea Gold Premium Black Tea with 15% Long Leaves (1 kg)',
    slug: 'tata-tea-gold-premium-1kg-clean',
    brand: 'Tata Consumer',
    categorySlug: 'grocery-food',
    subcategory: 'Tea & Coffee',
    price: 495,
    mrp: 620,
    discountPercent: 20,
    ratingAvg: 4.6,
    reviewCount: 16800,
    images: [
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Exquisite blend of rich Assam CTC tea and 15% gently rolled long leaves for rich taste and irresistible aroma.',
    tags: ['tea', 'chai', 'tatatea', 'grocery', 'beverage'],
    quantity: 180,
  },
  {
    title: 'Ferrero Rocher Premium Crisp Hazelnut Chocolates (24 Pieces Gift Box)',
    slug: 'ferrero-rocher-chocolates-24-pieces-box-clean',
    brand: 'Ferrero Rocher',
    categorySlug: 'grocery-food',
    subcategory: 'Chocolates & Sweets',
    price: 899,
    mrp: 1099,
    discountPercent: 18,
    ratingAvg: 4.8,
    reviewCount: 11200,
    images: [
      'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Whole crunchy hazelnut in the center, delicious creamy chocolate hazelnut filling, and a crisp wafer shell covered with milk chocolate.',
    tags: ['chocolate', 'ferrerorocher', 'gifting', 'sweets'],
    quantity: 90,
  },

  // 12. PET SUPPLIES
  {
    title: 'Pedigree Adult Dry Dog Food Meat & Rice (10 kg Pack)',
    slug: 'pedigree-adult-dry-dog-food-meat-rice-10kg-clean',
    brand: 'Pedigree',
    categorySlug: 'pet-supplies',
    subcategory: 'Dog Food',
    price: 2499,
    mrp: 3200,
    discountPercent: 22,
    ratingAvg: 4.6,
    reviewCount: 9400,
    images: [
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1000&q=80',
    ],
    description: 'Complete & balanced nutrition for adult dogs with 20% crude protein, Omega 6, and zinc for a healthy, shiny coat.',
    tags: ['pedigree', 'dogfood', 'petcare', 'petfood'],
    quantity: 60,
  },

  // 13. AUTOMOTIVE
  {
    title: 'Bosch GSB 500W Impact Drill Kit with 100 Accessories in Tool Box',
    slug: 'bosch-gsb-500w-impact-drill-kit-clean',
    brand: 'Bosch',
    categorySlug: 'automotive',
    subcategory: 'Power Tools',
    price: 3699,
    mrp: 5800,
    discountPercent: 36,
    ratingAvg: 4.5,
    reviewCount: 6800,
    images: [
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80',
    ],
    description: '500W robust motor with forward/reverse rotation, variable speed trigger, and 100-piece hand tool and accessory kit.',
    tags: ['bosch', 'drill', 'powertools', 'diy', 'hardware'],
    quantity: 55,
  },
];

async function main() {
  console.log('🚀 Seeding 100% Unique, Non-Duplicate Amazon Catalog...');

  const seller = await prisma.seller.findFirst({ select: { id: true } });
  if (!seller) throw new Error('No seller found');
  const sellerId = seller.id;

  const categories = await prisma.category.findMany();
  const catMap = new Map<string, string>();
  categories.forEach((c) => catMap.set(c.slug, c.id));

  let upsertedCount = 0;

  for (const p of PRODUCTS) {
    let categoryId = catMap.get(p.categorySlug);
    if (!categoryId) {
      const name = p.categorySlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const newCat = await prisma.category.upsert({
        where: { slug: p.categorySlug },
        update: {},
        create: { name, slug: p.categorySlug },
      });
      catMap.set(p.categorySlug, newCat.id);
      categoryId = newCat.id;
    }

    const created = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        brand: p.brand,
        subcategory: p.subcategory,
        price: p.price,
        mrp: p.mrp,
        discountPercent: p.discountPercent,
        images: p.images,
        description: p.description,
        tags: p.tags,
        status: 'ACTIVE',
        ratingAvg: p.ratingAvg,
        reviewCount: p.reviewCount,
      },
      create: {
        sellerId,
        categoryId,
        title: p.title,
        slug: p.slug,
        brand: p.brand,
        subcategory: p.subcategory,
        price: p.price,
        mrp: p.mrp,
        discountPercent: p.discountPercent,
        images: p.images,
        description: p.description,
        tags: p.tags,
        status: 'ACTIVE',
        ratingAvg: p.ratingAvg,
        reviewCount: p.reviewCount,
        inventory: {
          create: {
            sellerId,
            quantity: p.quantity,
            reserved: 0,
            lowStockThreshold: 5,
          },
        },
      },
    });

    upsertedCount++;
  }

  const total = await prisma.product.count();
  console.log(`✅ Successfully seeded ${upsertedCount} completely unique products! Total in DB: ${total}`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
