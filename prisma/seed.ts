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

  // Create digital product categories
  const templates = await prisma.category.upsert({
    where: { slug: 'templates' },
    update: {},
    create: {
      name: 'Website Templates',
      slug: 'templates',
      description: 'Professional website templates for various frameworks',
    },
  });

  const reactTemplates = await prisma.category.upsert({
    where: { slug: 'react-templates' },
    update: {},
    create: {
      name: 'React Templates',
      slug: 'react-templates',
      description: 'React.js website and admin templates',
      parentId: templates.id,
    },
  });

  const saasTemplates = await prisma.category.upsert({
    where: { slug: 'saas-templates' },
    update: {},
    create: {
      name: 'SaaS Templates',
      slug: 'saas-templates',
      description: 'SaaS landing pages and dashboard templates',
      parentId: templates.id,
    },
  });

  const adminDashboards = await prisma.category.upsert({
    where: { slug: 'admin-dashboards' },
    update: {},
    create: {
      name: 'Admin Dashboards',
      slug: 'admin-dashboards',
      description: 'Admin panel and dashboard templates',
      parentId: templates.id,
    },
  });

  const wordpressThemes = await prisma.category.upsert({
    where: { slug: 'wordpress-themes' },
    update: {},
    create: {
      name: 'WordPress Themes',
      slug: 'wordpress-themes',
      description: 'Premium WordPress themes',
      parentId: templates.id,
    },
  });

  const designAssets = await prisma.category.upsert({
    where: { slug: 'design-assets' },
    update: {},
    create: {
      name: 'Design Assets',
      slug: 'design-assets',
      description: 'UI kits, icons, illustrations, and design resources',
    },
  });

  const uiKits = await prisma.category.upsert({
    where: { slug: 'ui-kits' },
    update: {},
    create: {
      name: 'UI Kits',
      slug: 'ui-kits',
      description: 'Complete UI kits for web and mobile',
      parentId: designAssets.id,
    },
  });

  const iconPacks = await prisma.category.upsert({
    where: { slug: 'icon-packs' },
    update: {},
    create: {
      name: 'Icon Packs',
      slug: 'icon-packs',
      description: 'Vector icon collections',
      parentId: designAssets.id,
    },
  });

  const illustrations = await prisma.category.upsert({
    where: { slug: 'illustrations' },
    update: {},
    create: {
      name: 'Illustrations',
      slug: 'illustrations',
      description: 'Digital illustrations and artwork',
      parentId: designAssets.id,
    },
  });

  const mobileApps = await prisma.category.upsert({
    where: { slug: 'mobile-apps' },
    update: {},
    create: {
      name: 'Mobile App Templates',
      slug: 'mobile-apps',
      description: 'React Native, Flutter, and native mobile app templates',
    },
  });

  const reactNative = await prisma.category.upsert({
    where: { slug: 'react-native' },
    update: {},
    create: {
      name: 'React Native',
      slug: 'react-native',
      description: 'React Native app templates',
      parentId: mobileApps.id,
    },
  });

  const flutter = await prisma.category.upsert({
    where: { slug: 'flutter' },
    update: {},
    create: {
      name: 'Flutter',
      slug: 'flutter',
      description: 'Flutter app templates',
      parentId: mobileApps.id,
    },
  });

  const documents = await prisma.category.upsert({
    where: { slug: 'documents' },
    update: {},
    create: {
      name: 'Documents & Templates',
      slug: 'documents',
      description: 'Resume, presentation, and document templates',
    },
  });

  const resumes = await prisma.category.upsert({
    where: { slug: 'resumes' },
    update: {},
    create: {
      name: 'Resume Templates',
      slug: 'resumes',
      description: 'Professional resume and CV templates',
      parentId: documents.id,
    },
  });

  const presentations = await prisma.category.upsert({
    where: { slug: 'presentations' },
    update: {},
    create: {
      name: 'Presentation Templates',
      slug: 'presentations',
      description: 'PowerPoint, Keynote, and Google Slides templates',
      parentId: documents.id,
    },
  });

  const ebooks = await prisma.category.upsert({
    where: { slug: 'ebooks' },
    update: {},
    create: {
      name: 'E-books & Guides',
      slug: 'ebooks',
      description: 'Technical e-books and guides',
      parentId: documents.id,
    },
  });

  const developerTools = await prisma.category.upsert({
    where: { slug: 'developer-tools' },
    update: {},
    create: {
      name: 'Developer Tools',
      slug: 'developer-tools',
      description: 'CLI tools, boilerplates, and developer utilities',
    },
  });

  const marketing = await prisma.category.upsert({
    where: { slug: 'marketing' },
    update: {},
    create: {
      name: 'Marketing Templates',
      slug: 'marketing',
      description: 'Email, social media, and landing page templates',
    },
  });

  const emailTemplates = await prisma.category.upsert({
    where: { slug: 'email-templates' },
    update: {},
    create: {
      name: 'Email Templates',
      slug: 'email-templates',
      description: 'HTML email templates',
      parentId: marketing.id,
    },
  });

  const socialMedia = await prisma.category.upsert({
    where: { slug: 'social-media' },
    update: {},
    create: {
      name: 'Social Media Templates',
      slug: 'social-media',
      description: 'Instagram, LinkedIn, Twitter templates',
      parentId: marketing.id,
    },
  });

  const ecommerce = await prisma.category.upsert({
    where: { slug: 'ecommerce' },
    update: {},
    create: {
      name: 'E-commerce Templates',
      slug: 'ecommerce',
      description: 'Shopify, WooCommerce, and custom e-commerce templates',
    },
  });

  console.log('✅ Categories created');

  // Create digital products with realistic images
  // Using high-quality placeholder images that represent digital products
  const products = [
    // React Templates
    {
      title: 'React Admin Dashboard Pro',
      slug: 'react-admin-dashboard-pro',
      description: 'Professional React admin dashboard with 50+ components, 10+ pages, dark mode, charts, tables, forms, and authentication. Built with React 18, TypeScript, Tailwind CSS, and Recharts.',
      price: 4999,
      mrp: 7999,
      categoryId: adminDashboards.id,
      sellerId: seller.id,
      tags: ['react', 'typescript', 'tailwind', 'dashboard', 'admin', 'charts'],
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', // Dashboard UI
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', // Code/analytics
        'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop', // Analytics dashboard
      ],
      status: 'ACTIVE',
    },
    {
      title: 'SaaS Landing Page Template',
      slug: 'saas-landing-page-template',
      description: 'Modern SaaS landing page with hero, features, pricing, testimonials, FAQ, and footer sections. Fully responsive, SEO optimized, built with React 18, Next.js 14, and Tailwind CSS.',
      price: 2999,
      mrp: 4999,
      categoryId: saasTemplates.id,
      sellerId: seller.id,
      tags: ['react', 'nextjs', 'saas', 'landing-page', 'tailwind', 'seo'],
      images: [
        'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop', // Landing page design
        'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop', // UI design
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', // Dashboard
      ],
      status: 'ACTIVE',
    },
    {
      title: 'E-commerce React Template',
      slug: 'ecommerce-react-template',
      description: 'Complete e-commerce frontend with product listing, cart, checkout, user dashboard, and admin panel. Built with React 18, Redux Toolkit, React Router, and Tailwind CSS.',
      price: 6999,
      mrp: 9999,
      categoryId: ecommerce.id,
      sellerId: seller.id,
      tags: ['react', 'ecommerce', 'redux', 'shopping-cart', 'tailwind'],
      images: [
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop', // E-commerce UI
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', // Product grid
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', // Dashboard
      ],
      status: 'ACTIVE',
    },
    {
      title: 'Portfolio Website Template',
      slug: 'portfolio-website-template',
      description: 'Creative portfolio template for developers, designers, and agencies. Includes project showcase, about, services, blog, and contact sections. Built with React, Framer Motion, and Tailwind CSS.',
      price: 1999,
      mrp: 3499,
      categoryId: reactTemplates.id,
      sellerId: seller.id,
      tags: ['react', 'portfolio', 'framer-motion', 'tailwind', 'creative'],
      images: [
        'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop', // Portfolio design
        'https://images.unsplash.com/photo-1558655146-9f40137d7710?w=800&h=600&fit=crop', // Creative design
        'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop', // UI
      ],
      status: 'ACTIVE',
    },
    // WordPress Themes
    {
      title: 'Business WordPress Theme',
      slug: 'business-wordpress-theme',
      description: 'Multipurpose business WordPress theme with Elementor integration, 20+ demos, WooCommerce compatible, SEO optimized, RTL support, and one-click demo import.',
      price: 5999,
      mrp: 8999,
      categoryId: wordpressThemes.id,
      sellerId: seller.id,
      tags: ['wordpress', 'elementor', 'woocommerce', 'business', 'seo', 'rtl'],
      images: [
        'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop', // WordPress theme
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', // Dashboard
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', // Code
      ],
      status: 'ACTIVE',
    },
    {
      title: 'Blog & Magazine WordPress Theme',
      slug: 'blog-magazine-wordpress-theme',
      description: 'Modern blog and magazine WordPress theme with multiple post formats, infinite scroll, newsletter, social sharing, and GDPR compliance.',
      price: 4499,
      mrp: 6999,
      categoryId: wordpressThemes.id,
      sellerId: seller.id,
      tags: ['wordpress', 'blog', 'magazine', 'newsletter', 'seo', 'gdpr'],
      images: [
        'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=600&fit=crop', // Blog layout
        'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&h=600&fit=crop', // Magazine
        'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop', // Website
      ],
      status: 'ACTIVE',
    },
    // UI Kits
    {
      title: 'Complete UI Kit - 500+ Components',
      slug: 'complete-ui-kit-500-components',
      description: 'Massive UI kit with 500+ components, 50+ pages, design system, Figma files, React components, HTML version, and documentation. Supports light/dark mode.',
      price: 8999,
      mrp: 12999,
      categoryId: uiKits.id,
      sellerId: seller.id,
      tags: ['ui-kit', 'figma', 'react', 'html', 'design-system', 'components'],
      images: [
        'https://images.unsplash.com/photo-1558655146-9f40137d7710?w=800&h=600&fit=crop', // UI components
        'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop', // Design system
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', // Dashboard
      ],
      status: 'ACTIVE',
    },
    {
      title: 'Mobile App UI Kit - React Native',
      slug: 'mobile-app-ui-kit-react-native',
      description: 'Complete mobile app UI kit for React Native with 100+ screens, navigation, forms, onboarding, auth, chat, profile, settings, and more. Includes Expo and CLI versions.',
      price: 5999,
      mrp: 8999,
      categoryId: reactNative.id,
      sellerId: seller.id,
      tags: ['react-native', 'expo', 'mobile', 'ui-kit', 'screens', 'navigation'],
      images: [
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop', // Mobile app screens
        'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop', // Phone UI
        'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop', // App design
      ],
      status: 'ACTIVE',
    },
    {
      title: 'Flutter App UI Kit',
      slug: 'flutter-app-ui-kit',
      description: 'Premium Flutter UI kit with 80+ screens, custom widgets, animations, state management (Provider/Riverpod), and Firebase integration. Material 3 design.',
      price: 5499,
      mrp: 7999,
      categoryId: flutter.id,
      sellerId: seller.id,
      tags: ['flutter', 'dart', 'mobile', 'ui-kit', 'material-3', 'firebase'],
      images: [
        'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop', // Mobile app
        'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop', // Phone screens
        'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop', // UI design
      ],
      status: 'ACTIVE',
    },
    // Icon Packs
    {
      title: 'Essential Icon Pack - 2000+ Icons',
      slug: 'essential-icon-pack-2000-icons',
      description: 'Comprehensive icon pack with 2000+ vector icons in outline, fill, and duotone styles. Available as SVG, Figma, React components, Font, and PNG. Regular updates.',
      price: 1499,
      mrp: 2499,
      categoryId: iconPacks.id,
      sellerId: seller.id,
      tags: ['icons', 'svg', 'figma', 'react', 'font', 'vector', 'duotone'],
      images: [
        'https://images.unsplash.com/photo-1558655146-9f40137d7710?w=800&h=600&fit=crop', // Icons
        'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop', // Design
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', // Collection
      ],
      status: 'ACTIVE',
    },
    {
      title: 'E-commerce Icon Set',
      slug: 'ecommerce-icon-set',
      description: 'Specialized e-commerce icon set with 300+ icons for shopping, payments, shipping, products, categories, and UI. Multiple styles and formats included.',
      price: 999,
      mrp: 1499,
      categoryId: iconPacks.id,
      sellerId: seller.id,
      tags: ['icons', 'ecommerce', 'shopping', 'payment', 'shipping', 'svg'],
      images: [
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop', // E-commerce
        'https://images.unsplash.com/photo-1558655146-9f40137d7710?w=800&h=600&fit=crop', // Icons
        'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop', // Design
      ],
      status: 'ACTIVE',
    },
    // Illustrations
    {
      title: 'Startup Illustration Pack',
      slug: 'startup-illustration-pack',
      description: '50+ hand-drawn startup and business illustrations in SVG and PNG. Covers onboarding, empty states, success, error, team, growth, and marketing scenarios.',
      price: 2499,
      mrp: 3999,
      categoryId: illustrations.id,
      sellerId: seller.id,
      tags: ['illustrations', 'startup', 'business', 'svg', 'hand-drawn', 'onboarding'],
      images: [
        'https://images.unsplash.com/photo-1558655146-9f40137d7710?w=800&h=600&fit=crop', // Illustrations
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', // Creative
        'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop', // Design
      ],
      status: 'ACTIVE',
    },
    {
      title: '3D Illustration Pack - Isometric',
      slug: '3d-illustration-pack-isometric',
      description: '40+ high-quality 3D isometric illustrations for tech, finance, healthcare, education, and e-commerce. Blender source files included. Perfect for landing pages.',
      price: 3999,
      mrp: 5999,
      categoryId: illustrations.id,
      sellerId: seller.id,
      tags: ['3d', 'isometric', 'blender', 'illustrations', 'tech', 'landing-page'],
      images: [
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=600&fit=crop', // 3D illustrations
        'https://images.unsplash.com/photo-1558655146-9f40137d7710?w=800&h=600&fit=crop', // Design
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', // Creative
      ],
      status: 'ACTIVE',
    },
    // Resume Templates
    {
      title: 'Professional Resume Template Pack',
      slug: 'professional-resume-template-pack',
      description: '15 professional resume/CV templates in Word, Google Docs, Figma, and PDF formats. ATS-friendly, modern designs for tech, marketing, finance, and creative roles.',
      price: 799,
      mrp: 1499,
      categoryId: resumes.id,
      sellerId: seller.id,
      tags: ['resume', 'cv', 'word', 'google-docs', 'figma', 'ats-friendly', 'templates'],
      images: [
        'https://images.unsplash.com/photo-1586282391129-91b8f92e4e5a?w=800&h=600&fit=crop', // Resume
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop', // Document
        'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop', // Layout
      ],
      status: 'ACTIVE',
    },
    {
      title: 'Creative Resume & Cover Letter',
      slug: 'creative-resume-cover-letter',
      description: 'Unique creative resume templates with matching cover letters. 10 designs in InDesign, Illustrator, Figma, and Canva. Perfect for designers and creatives.',
      price: 1299,
      mrp: 1999,
      categoryId: resumes.id,
      sellerId: seller.id,
      tags: ['resume', 'cover-letter', 'indesign', 'illustrator', 'figma', 'canva', 'creative'],
      images: [
        'https://images.unsplash.com/photo-1586282391129-91b8f92e4e5a?w=800&h=600&fit=crop', // Creative resume
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop', // Document
        'https://images.unsplash.com/photo-1558655146-9f40137d7710?w=800&h=600&fit=crop', // Design
      ],
      status: 'ACTIVE',
    },
    // Presentation Templates
    {
      title: 'Business Presentation Template Pack',
      slug: 'business-presentation-template-pack',
      description: '50+ professional slide templates for PowerPoint, Keynote, and Google Slides. Includes pitch decks, quarterly reports, project proposals, and strategy presentations.',
      price: 1999,
      mrp: 3499,
      categoryId: presentations.id,
      sellerId: seller.id,
      tags: ['presentation', 'powerpoint', 'keynote', 'google-slides', 'pitch-deck', 'business'],
      images: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop', // Slides
        'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop', // Presentation
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', // Dashboard
      ],
      status: 'ACTIVE',
    },
    {
      title: 'Startup Pitch Deck Template',
      slug: 'startup-pitch-deck-template',
      description: 'Investor-ready pitch deck template with 30+ slides, financial models, market analysis, traction, and team slides. Proven structure used by funded startups.',
      price: 2999,
      mrp: 4999,
      categoryId: presentations.id,
      sellerId: seller.id,
      tags: ['pitch-deck', 'startup', 'investor', 'funding', 'powerpoint', 'keynote'],
      images: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop', // Pitch deck
        'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop', // Slides
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', // Charts
      ],
      status: 'ACTIVE',
    },
    // E-books
    {
      title: 'React Design Patterns E-book',
      slug: 'react-design-patterns-ebook',
      description: 'Comprehensive 200+ page e-book covering React design patterns, hooks, state management, performance optimization, testing, and architecture. Includes code examples.',
      price: 1499,
      mrp: 2499,
      categoryId: ebooks.id,
      sellerId: seller.id,
      tags: ['ebook', 'react', 'design-patterns', 'hooks', 'architecture', 'typescript'],
      images: [
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=600&fit=crop', // E-book
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop', // Book
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', // Code
      ],
      status: 'ACTIVE',
    },
    {
      title: 'System Design Interview Guide',
      slug: 'system-design-interview-guide',
      description: 'Complete system design interview preparation guide with 50+ real-world scenarios, diagrams, trade-offs, and solutions. PDF + Notion template included.',
      price: 1999,
      mrp: 2999,
      categoryId: ebooks.id,
      sellerId: seller.id,
      tags: ['ebook', 'system-design', 'interview', 'architecture', 'scalability', 'notion'],
      images: [
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=600&fit=crop', // Guide
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop', // Book
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', // Architecture
      ],
      status: 'ACTIVE',
    },
    // Developer Tools
    {
      title: 'Next.js SaaS Boilerplate',
      slug: 'nextjs-saas-boilerplate',
      description: 'Production-ready Next.js 14 SaaS boilerplate with authentication (NextAuth), payments (Stripe), database (Prisma/PostgreSQL), emails, admin dashboard, and CI/CD.',
      price: 9999,
      mrp: 14999,
      categoryId: developerTools.id,
      sellerId: seller.id,
      tags: ['nextjs', 'saas', 'boilerplate', 'stripe', 'prisma', 'nextauth', 'typescript'],
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', // Dashboard
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', // Code
        'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop', // UI
      ],
      status: 'ACTIVE',
    },
    {
      title: 'React Component Library Starter',
      slug: 'react-component-library-starter',
      description: 'Monorepo starter for building React component libraries with Storybook, Vite, Vitest, Changesets, and npm publishing. Includes CI/CD and documentation site.',
      price: 3999,
      mrp: 5999,
      categoryId: developerTools.id,
      sellerId: seller.id,
      tags: ['react', 'component-library', 'storybook', 'vite', 'monorepo', 'npm', 'typescript'],
      images: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', // Code
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', // Dashboard
        'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop', // UI
      ],
      status: 'ACTIVE',
    },
    // Email Templates
    {
      title: 'Transactional Email Template Pack',
      slug: 'transactional-email-template-pack',
      description: '30+ responsive HTML email templates for welcome, password reset, order confirmation, shipping, receipts, and notifications. Tested on 50+ email clients.',
      price: 2499,
      mrp: 3999,
      categoryId: emailTemplates.id,
      sellerId: seller.id,
      tags: ['email', 'html', 'transactional', 'responsive', 'mailchimp', 'sendgrid'],
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', // Email dashboard
        'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop', // Template
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', // Code
      ],
      status: 'ACTIVE',
    },
    // Social Media
    {
      title: 'Social Media Content Kit',
      slug: 'social-media-content-kit',
      description: '200+ Canva templates for Instagram posts, stories, reels covers, LinkedIn posts, Twitter threads, and YouTube thumbnails. Brand kit included.',
      price: 1999,
      mrp: 2999,
      categoryId: socialMedia.id,
      sellerId: seller.id,
      tags: ['canva', 'instagram', 'linkedin', 'twitter', 'youtube', 'social-media', 'branding'],
      images: [
        'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop', // Social media
        'https://images.unsplash.com/photo-1558655146-9f40137d7710?w=800&h=600&fit=crop', // Design
        'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop', // Layout
      ],
      status: 'ACTIVE',
    },
    // E-commerce
    {
      title: 'Shopify Theme - Fashion Store',
      slug: 'shopify-theme-fashion-store',
      description: 'Premium Shopify 2.0 theme for fashion and apparel stores. Features quick view, color swatches, size guide, lookbook, infinite scroll, and 20+ sections.',
      price: 12999,
      mrp: 17999,
      categoryId: ecommerce.id,
      sellerId: seller.id,
      tags: ['shopify', 'fashion', 'apparel', 'theme', 'ecommerce', 'os2'],
      images: [
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop', // Fashion store
        'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop', // Shopify
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', // Dashboard
      ],
      status: 'ACTIVE',
    },
    {
      title: 'WooCommerce Theme - Electronics',
      slug: 'woocommerce-theme-electronics',
      description: 'Feature-rich WooCommerce theme for electronics and gadgets. Includes product comparison, wishlist, quick view, AJAX filters, and Elementor integration.',
      price: 8999,
      mrp: 12999,
      categoryId: ecommerce.id,
      sellerId: seller.id,
      tags: ['woocommerce', 'electronics', 'wordpress', 'elementor', 'ajax', 'comparison'],
      images: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', // Electronics
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop', // E-commerce
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', // Dashboard
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

  // Create wallet for customer with some balance for testing
  await prisma.wallet.upsert({
    where: { userId: customer.id },
    update: {},
    create: { userId: customer.id, balance: 5000 },
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