import { PrismaClient, UserRole, UserStatus, VendorTier, KycStatus, ProductStatus, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Hash passwords once for performance
let hashedPasswords: {
  admin: string;
  vendor: string;
  buyer: string;
};

async function hashPasswords() {
  console.log('🔐 Hashing passwords...');
  hashedPasswords = {
    admin: await argon2.hash('Admin@123'),
    vendor: await argon2.hash('Vendor@123'),
    buyer: await argon2.hash('Buyer@123'),
  };
}

async function seedUsers() {
  console.log('👥 Seeding users...');

  // Super Admin
  await prisma.user.upsert({
    where: { email: 'admin@lankamart.com' },
    update: {},
    create: {
      email: 'admin@lankamart.com',
      passwordHash: hashedPasswords.admin,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      firstName: 'Super',
      lastName: 'Admin',
    },
  });

  // Admin
  await prisma.user.upsert({
    where: { email: 'moderator@lankamart.com' },
    update: {},
    create: {
      email: 'moderator@lankamart.com',
      passwordHash: hashedPasswords.admin,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      firstName: 'Platform',
      lastName: 'Moderator',
    },
  });

  // Vendor 1: Ceylon Spice Gardens
  await prisma.user.upsert({
    where: { email: 'vendor1@ceylonspice.lk' },
    update: {},
    create: {
      email: 'vendor1@ceylonspice.lk',
      passwordHash: hashedPasswords.vendor,
      role: UserRole.VENDOR,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      firstName: 'Lakshan',
      lastName: 'Perera',
      phone: '+94771234567',
      phoneVerified: true,
    },
  });

  // Vendor 2: Raj Textiles India
  await prisma.user.upsert({
    where: { email: 'vendor2@rajtextiles.in' },
    update: {},
    create: {
      email: 'vendor2@rajtextiles.in',
      passwordHash: hashedPasswords.vendor,
      role: UserRole.VENDOR,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      phone: '+919876543210',
      phoneVerified: true,
    },
  });

  // Vendor 3: Lanka Gems Co.
  await prisma.user.upsert({
    where: { email: 'vendor3@lankagems.lk' },
    update: {},
    create: {
      email: 'vendor3@lankagems.lk',
      passwordHash: hashedPasswords.vendor,
      role: UserRole.VENDOR,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      firstName: 'Nimal',
      lastName: 'Silva',
      phone: '+94777654321',
      phoneVerified: true,
    },
  });

  // Buyer
  await prisma.user.upsert({
    where: { email: 'buyer@gmail.com' },
    update: {},
    create: {
      email: 'buyer@gmail.com',
      passwordHash: hashedPasswords.buyer,
      role: UserRole.BUYER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+12125551234',
      phoneVerified: true,
    },
  });

  console.log('✅ Users seeded');
}

async function seedVendorProfiles() {
  console.log('🏢 Seeding vendor profiles...');

  const vendor1 = await prisma.user.findUnique({ where: { email: 'vendor1@ceylonspice.lk' } });
  const vendor2 = await prisma.user.findUnique({ where: { email: 'vendor2@rajtextiles.in' } });
  const vendor3 = await prisma.user.findUnique({ where: { email: 'vendor3@lankagems.lk' } });

  if (!vendor1 || !vendor2 || !vendor3) {
    throw new Error('Vendors not found');
  }

  // Ceylon Spice Gardens
  await prisma.vendorProfile.upsert({
    where: { businessSlug: 'ceylon-spice-gardens' },
    update: {},
    create: {
      userId: vendor1.id,
      businessName: 'Ceylon Spice Gardens',
      businessSlug: 'ceylon-spice-gardens',
      description: 'Premium organic spices from the hills of Sri Lanka. We specialize in authentic Ceylon cinnamon, premium teas, and traditional Ayurvedic products. Family-owned business since 1985.',
      country: 'LK',
      city: 'Kandy',
      tier: VendorTier.PREMIUM,
      kycStatus: KycStatus.APPROVED,
      isVerified: true,
      website: 'https://ceylonspicegardens.lk',
      yearEstablished: 1985,
      employeeCount: '51-100',
      mainProducts: 'Cinnamon, Tea, Spices, Coconut Products, Ayurvedic Items',
      averageRating: 4.80,
      totalReviews: 342,
      totalSales: 1256,
      responseTimeHrs: 2.5,
    },
  });

  // Raj Textiles India
  await prisma.vendorProfile.upsert({
    where: { businessSlug: 'raj-textiles-india' },
    update: {},
    create: {
      userId: vendor2.id,
      businessName: 'Raj Textiles India',
      businessSlug: 'raj-textiles-india',
      description: 'Finest handloom silks and cotton fabrics from Tamil Nadu. Specializing in Kanchipuram silk sarees, block-printed textiles, and designer apparel. Three generations of textile expertise.',
      country: 'IN',
      city: 'Chennai',
      tier: VendorTier.PREMIUM,
      kycStatus: KycStatus.APPROVED,
      isVerified: true,
      website: 'https://rajtextiles.in',
      yearEstablished: 1978,
      employeeCount: '101-200',
      mainProducts: 'Silk Sarees, Handloom Fabrics, Cotton Textiles, Designer Apparel',
      gstNumber: '33AABCU9603R1ZX',
      averageRating: 4.60,
      totalReviews: 218,
      totalSales: 892,
      responseTimeHrs: 4.0,
    },
  });

  // Lanka Gems Co.
  await prisma.vendorProfile.upsert({
    where: { businessSlug: 'lanka-gems-co' },
    update: {},
    create: {
      userId: vendor3.id,
      businessName: 'Lanka Gems Co.',
      businessSlug: 'lanka-gems-co',
      description: 'Certified precious and semi-precious gemstones from the gem capital of Sri Lanka. All stones are ethically sourced, GIA certified, and come with authenticity guarantees. Specializing in blue sapphires, rubies, and custom jewellery.',
      country: 'LK',
      city: 'Ratnapura',
      tier: VendorTier.ENTERPRISE,
      kycStatus: KycStatus.APPROVED,
      isVerified: true,
      website: 'https://lankagemsco.com',
      yearEstablished: 1992,
      employeeCount: '11-50',
      mainProducts: 'Blue Sapphires, Rubies, Yellow Sapphires, Custom Jewellery',
      certifications: JSON.stringify(['GIA Certified', 'ISO 9001:2015']),
      averageRating: 4.90,
      totalReviews: 156,
      totalSales: 534,
      responseTimeHrs: 1.5,
    },
  });

  console.log('✅ Vendor profiles seeded');
}

async function seedCategories() {
  console.log('📂 Seeding categories...');

  const categories = [
    {
      slug: 'tea-spices',
      name: 'Tea & Spices',
      description: 'Premium Ceylon tea, cinnamon, cardamom, and exotic spices',
      imageUrl: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=300&fit=crop',
    },
    {
      slug: 'textiles-apparel',
      name: 'Textiles & Apparel',
      description: 'Handloom fabrics, batik, silk, and designer clothing',
      imageUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=300&fit=crop',
    },
    {
      slug: 'gems-jewellery',
      name: 'Gems & Jewellery',
      description: 'Ceylon sapphires, rubies, and handcrafted jewellery',
      imageUrl: 'https://images.unsplash.com/photo-1515562141589-67f0d569b6ac?w=400&h=300&fit=crop',
    },
    {
      slug: 'handicrafts',
      name: 'Handicrafts',
      description: 'Traditional wood carvings, lacquerware, and pottery',
      imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=400&h=300&fit=crop',
    },
    {
      slug: 'coconut-products',
      name: 'Coconut Products',
      description: 'Coconut oil, coir products, activated charcoal, and more',
      imageUrl: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=300&fit=crop',
    },
    {
      slug: 'electronics-parts',
      name: 'Electronics & Parts',
      description: 'Electronic components, PCB assemblies, and tech accessories',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
    },
    {
      slug: 'ayurveda-wellness',
      name: 'Ayurveda & Wellness',
      description: 'Natural remedies, herbal supplements, and wellness products',
      imageUrl: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&h=300&fit=crop',
    },
    {
      slug: 'food-beverages',
      name: 'Food & Beverages',
      description: 'Packaged foods, snacks, sauces, and specialty beverages',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        isActive: true,
        sortOrder: 0,
      },
    });
  }

  console.log('✅ Categories seeded');
}

async function seedProducts() {
  console.log('🛍️  Seeding products...');

  const vendor1 = await prisma.user.findUnique({ where: { email: 'vendor1@ceylonspice.lk' } });
  const vendor2 = await prisma.user.findUnique({ where: { email: 'vendor2@rajtextiles.in' } });
  const vendor3 = await prisma.user.findUnique({ where: { email: 'vendor3@lankagems.lk' } });

  const categories = await prisma.category.findMany();
  const catMap = Object.fromEntries(categories.map(c => [c.slug, c.id]));

  if (!vendor1 || !vendor2 || !vendor3) {
    throw new Error('Vendors not found');
  }

  // Product 1: Premium Ceylon Cinnamon Sticks
  const p1 = await prisma.product.upsert({
    where: { slug: 'premium-ceylon-cinnamon-alba' },
    update: {},
    create: {
      vendorId: vendor1.id,
      categoryId: catMap['tea-spices'],
      name: 'Premium Ceylon Cinnamon Sticks - Grade Alba',
      slug: 'premium-ceylon-cinnamon-alba',
      description: 'Authentic Ceylon cinnamon (Cinnamomum verum) hand-harvested from our plantation in Galle. Grade Alba is the finest grade with paper-thin bark and a delicate, sweet flavour. Perfect for gourmet cooking, baking, and beverages. USDA Organic certified.',
      shortDesc: 'Finest grade Ceylon cinnamon, hand-harvested and organic certified',
      status: ProductStatus.ACTIVE,
      baseCurrency: 'USD',
      basePrice: 24.99,
      comparePrice: 34.99,
      moq: 1,
      unit: 'piece',
      originCountry: 'LK',
      isFeatured: true,
      averageRating: 4.8,
      totalReviews: 127,
      totalSold: 543,
      viewCount: 2341,
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: p1.id } });
  await prisma.productImage.createMany({
    data: [
      { productId: p1.id, url: 'https://images.unsplash.com/photo-1599909533706-bfa4f0b1cd4f?w=800&h=800&fit=crop', altText: 'Ceylon cinnamon sticks', isPrimary: true, sortOrder: 0 },
      { productId: p1.id, url: 'https://images.unsplash.com/photo-1562059390-a761a084768e?w=800&h=800&fit=crop', altText: 'Cinnamon packaging', isPrimary: false, sortOrder: 1 },
      { productId: p1.id, url: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=800&h=800&fit=crop', altText: 'Cinnamon plantation', isPrimary: false, sortOrder: 2 },
    ],
  });

  await prisma.productVariant.deleteMany({ where: { productId: p1.id } });
  await prisma.productVariant.createMany({
    data: [
      { productId: p1.id, sku: 'CIN-ALB-100', name: '100g Pack', price: 24.99, stock: 500, attributes: JSON.stringify({ weight: '100g' }) },
      { productId: p1.id, sku: 'CIN-ALB-250', name: '250g Pack', price: 49.99, stock: 300, attributes: JSON.stringify({ weight: '250g' }) },
      { productId: p1.id, sku: 'CIN-ALB-1KG', name: '1kg Bulk', price: 149.99, stock: 100, attributes: JSON.stringify({ weight: '1kg' }) },
    ],
  });

  // Product 2: Handloom Silk Saree
  const p2 = await prisma.product.upsert({
    where: { slug: 'handloom-silk-saree-kanchipuram' },
    update: {},
    create: {
      vendorId: vendor2.id,
      categoryId: catMap['textiles-apparel'],
      name: 'Handloom Silk Saree - Kanchipuram Collection',
      slug: 'handloom-silk-saree-kanchipuram',
      description: 'Exquisite Kanchipuram silk saree woven by master artisans in Tamil Nadu. Features traditional temple border design with pure zari work. Each saree takes 15-20 days to weave by hand. Comes with matching blouse piece.',
      shortDesc: 'Traditional Kanchipuram silk with pure zari temple border',
      status: ProductStatus.ACTIVE,
      baseCurrency: 'USD',
      basePrice: 299.00,
      comparePrice: 450.00,
      moq: 1,
      unit: 'piece',
      originCountry: 'IN',
      isFeatured: true,
      averageRating: 4.9,
      totalReviews: 89,
      totalSold: 234,
      viewCount: 1876,
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: p2.id } });
  await prisma.productImage.createMany({
    data: [
      { productId: p2.id, url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=800&fit=crop', altText: 'Silk saree', isPrimary: true, sortOrder: 0 },
      { productId: p2.id, url: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&h=800&fit=crop', altText: 'Saree detail', isPrimary: false, sortOrder: 1 },
    ],
  });

  await prisma.productVariant.deleteMany({ where: { productId: p2.id } });
  await prisma.productVariant.createMany({
    data: [
      { productId: p2.id, sku: 'SAR-KAN-RED', name: 'Royal Red', price: 299.00, stock: 25, attributes: JSON.stringify({ color: 'Red', material: 'Pure Silk' }) },
      { productId: p2.id, sku: 'SAR-KAN-BLU', name: 'Peacock Blue', price: 319.00, stock: 20, attributes: JSON.stringify({ color: 'Blue', material: 'Pure Silk' }) },
      { productId: p2.id, sku: 'SAR-KAN-GRN', name: 'Emerald Green', price: 309.00, stock: 18, attributes: JSON.stringify({ color: 'Green', material: 'Pure Silk' }) },
    ],
  });

  // Product 3: Natural Blue Sapphire
  const p3 = await prisma.product.upsert({
    where: { slug: 'natural-blue-sapphire-2-5ct' },
    update: {},
    create: {
      vendorId: vendor3.id,
      categoryId: catMap['gems-jewellery'],
      name: 'Natural Blue Sapphire - 2.5 Carat Certified',
      slug: 'natural-blue-sapphire-2-5ct',
      description: 'Stunning natural blue sapphire mined from the gem pits of Ratnapura, Sri Lanka. Certified by GIA with excellent clarity and a vivid cornflower blue colour. Unheated and untreated. Perfect for engagement rings or fine jewellery.',
      shortDesc: 'GIA certified unheated Ceylon sapphire, vivid cornflower blue',
      status: ProductStatus.ACTIVE,
      baseCurrency: 'USD',
      basePrice: 4500.00,
      moq: 1,
      unit: 'piece',
      originCountry: 'LK',
      isFeatured: true,
      averageRating: 5.0,
      totalReviews: 23,
      totalSold: 45,
      viewCount: 3421,
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: p3.id } });
  await prisma.productImage.createMany({
    data: [
      { productId: p3.id, url: 'https://images.unsplash.com/photo-1599707367790-a54bafa72705?w=800&h=800&fit=crop', altText: 'Blue sapphire', isPrimary: true, sortOrder: 0 },
      { productId: p3.id, url: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&h=800&fit=crop', altText: 'Sapphire certificate', isPrimary: false, sortOrder: 1 },
    ],
  });

  await prisma.productVariant.deleteMany({ where: { productId: p3.id } });
  await prisma.productVariant.createMany({
    data: [
      { productId: p3.id, sku: 'SAP-BLU-2.5', name: '2.5 Carat', price: 4500.00, stock: 3, attributes: JSON.stringify({ carat: '2.5', cut: 'Oval' }) },
    ],
  });

  // Product 4: Organic Ceylon Black Tea
  const p4 = await prisma.product.upsert({
    where: { slug: 'organic-ceylon-black-tea-bop' },
    update: {},
    create: {
      vendorId: vendor1.id,
      categoryId: catMap['tea-spices'],
      name: 'Organic Ceylon Black Tea - BOP Grade',
      slug: 'organic-ceylon-black-tea-bop',
      description: 'Single-estate organic black tea from the Nuwara Eliya highlands. BOP (Broken Orange Pekoe) grade delivers a rich, full-bodied brew with bright golden liquor. Packed at origin for maximum freshness.',
      shortDesc: 'Single-estate highland tea, rich and full-bodied',
      status: ProductStatus.ACTIVE,
      baseCurrency: 'USD',
      basePrice: 18.50,
      comparePrice: 24.00,
      moq: 1,
      unit: 'piece',
      originCountry: 'LK',
      isFeatured: true,
      averageRating: 4.7,
      totalReviews: 215,
      totalSold: 892,
      viewCount: 4521,
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: p4.id } });
  await prisma.productImage.createMany({
    data: [
      { productId: p4.id, url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&h=800&fit=crop', altText: 'Ceylon black tea', isPrimary: true, sortOrder: 0 },
    ],
  });

  await prisma.productVariant.deleteMany({ where: { productId: p4.id } });
  await prisma.productVariant.createMany({
    data: [
      { productId: p4.id, sku: 'TEA-BOP-100', name: '100g Tin', price: 18.50, stock: 800, attributes: JSON.stringify({ weight: '100g' }) },
      { productId: p4.id, sku: 'TEA-BOP-250', name: '250g Tin', price: 39.99, stock: 400, attributes: JSON.stringify({ weight: '250g' }) },
    ],
  });

  // Product 5: Virgin Coconut Oil
  const p5 = await prisma.product.upsert({
    where: { slug: 'virgin-coconut-oil-cold-pressed' },
    update: {},
    create: {
      vendorId: vendor1.id,
      categoryId: catMap['coconut-products'],
      name: 'Virgin Coconut Oil - Cold Pressed',
      slug: 'virgin-coconut-oil-cold-pressed',
      description: 'Pure virgin coconut oil cold-pressed from fresh organic coconuts. Rich in lauric acid and MCTs. Perfect for cooking, skincare, and haircare. No additives, no bleaching, no deodorizing.',
      shortDesc: 'Pure cold-pressed organic coconut oil, multi-purpose',
      status: ProductStatus.ACTIVE,
      baseCurrency: 'USD',
      basePrice: 12.99,
      comparePrice: 18.00,
      moq: 2,
      unit: 'piece',
      originCountry: 'LK',
      isFeatured: true,
      averageRating: 4.6,
      totalReviews: 198,
      totalSold: 1234,
      viewCount: 5678,
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: p5.id } });
  await prisma.productImage.createMany({
    data: [
      { productId: p5.id, url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&h=800&fit=crop', altText: 'Coconut oil', isPrimary: true, sortOrder: 0 },
    ],
  });

  await prisma.productVariant.deleteMany({ where: { productId: p5.id } });
  await prisma.productVariant.createMany({
    data: [
      { productId: p5.id, sku: 'COC-VCO-500', name: '500ml Bottle', price: 12.99, stock: 600, attributes: JSON.stringify({ size: '500ml' }) },
      { productId: p5.id, sku: 'COC-VCO-1L', name: '1 Litre Bottle', price: 22.99, stock: 350, attributes: JSON.stringify({ size: '1L' }) },
    ],
  });

  // Product 6: Handwoven Cotton Kurta
  const p6 = await prisma.product.upsert({
    where: { slug: 'handwoven-cotton-kurta-block-printed' },
    update: {},
    create: {
      vendorId: vendor2.id,
      categoryId: catMap['textiles-apparel'],
      name: 'Handwoven Cotton Kurta - Block Printed',
      slug: 'handwoven-cotton-kurta-block-printed',
      description: "Men's handwoven cotton kurta with traditional Rajasthani block printing. Lightweight and breathable, perfect for summer. Each piece is individually hand-printed making every kurta unique.",
      shortDesc: 'Hand block-printed cotton kurta, lightweight summer wear',
      status: ProductStatus.ACTIVE,
      baseCurrency: 'USD',
      basePrice: 45.00,
      comparePrice: 65.00,
      moq: 1,
      unit: 'piece',
      originCountry: 'IN',
      isFeatured: true,
      averageRating: 4.5,
      totalReviews: 76,
      totalSold: 321,
      viewCount: 1987,
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: p6.id } });
  await prisma.productImage.createMany({
    data: [
      { productId: p6.id, url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&h=800&fit=crop', altText: 'Block printed kurta', isPrimary: true, sortOrder: 0 },
    ],
  });

  await prisma.productVariant.deleteMany({ where: { productId: p6.id } });
  await prisma.productVariant.createMany({
    data: [
      { productId: p6.id, sku: 'KUR-BLK-S', name: 'Small', price: 45.00, stock: 50, attributes: JSON.stringify({ size: 'S' }) },
      { productId: p6.id, sku: 'KUR-BLK-M', name: 'Medium', price: 45.00, stock: 80, attributes: JSON.stringify({ size: 'M' }) },
      { productId: p6.id, sku: 'KUR-BLK-L', name: 'Large', price: 45.00, stock: 60, attributes: JSON.stringify({ size: 'L' }) },
      { productId: p6.id, sku: 'KUR-BLK-XL', name: 'XL', price: 45.00, stock: 40, attributes: JSON.stringify({ size: 'XL' }) },
    ],
  });

  // Product 7: Ayurvedic Herbal Hair Oil
  const p7 = await prisma.product.upsert({
    where: { slug: 'ayurvedic-herbal-hair-oil-7herbs' },
    update: {},
    create: {
      vendorId: vendor1.id,
      categoryId: catMap['ayurveda-wellness'],
      name: 'Ayurvedic Herbal Hair Oil - 7 Herb Formula',
      slug: 'ayurvedic-herbal-hair-oil-7herbs',
      description: 'Traditional Ayurvedic hair oil infused with seven medicinal herbs including Bhringraj, Amla, Brahmi, and Neem. Promotes hair growth, prevents dandruff, and nourishes the scalp. Cold-processed in small batches.',
      shortDesc: 'Traditional 7-herb formula for hair growth and scalp health',
      status: ProductStatus.ACTIVE,
      baseCurrency: 'USD',
      basePrice: 16.99,
      comparePrice: 22.00,
      moq: 1,
      unit: 'piece',
      originCountry: 'LK',
      isFeatured: true,
      averageRating: 4.4,
      totalReviews: 312,
      totalSold: 876,
      viewCount: 3256,
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: p7.id } });
  await prisma.productImage.createMany({
    data: [
      { productId: p7.id, url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&h=800&fit=crop', altText: 'Herbal hair oil', isPrimary: true, sortOrder: 0 },
    ],
  });

  await prisma.productVariant.deleteMany({ where: { productId: p7.id } });
  await prisma.productVariant.createMany({
    data: [
      { productId: p7.id, sku: 'AYU-OIL-200', name: '200ml Bottle', price: 16.99, stock: 400, attributes: JSON.stringify({ size: '200ml' }) },
    ],
  });

  // Product 8: Handcarved Wooden Elephant
  const p8 = await prisma.product.upsert({
    where: { slug: 'handcarved-wooden-elephant-rosewood' },
    update: {},
    create: {
      vendorId: vendor1.id,
      categoryId: catMap['handicrafts'],
      name: 'Handcarved Wooden Elephant - Rosewood',
      slug: 'handcarved-wooden-elephant-rosewood',
      description: 'Beautifully hand-carved rosewood elephant by master craftsmen from Kandy. Traditional Sri Lankan design with intricate detailing. Each piece is unique and comes with a certificate of authenticity. Perfect as a decorative piece or gift.',
      shortDesc: 'Master-crafted rosewood elephant, traditional Sri Lankan artistry',
      status: ProductStatus.ACTIVE,
      baseCurrency: 'USD',
      basePrice: 89.00,
      comparePrice: 120.00,
      moq: 1,
      unit: 'piece',
      originCountry: 'LK',
      isFeatured: true,
      averageRating: 4.9,
      totalReviews: 54,
      totalSold: 187,
      viewCount: 2134,
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: p8.id } });
  await prisma.productImage.createMany({
    data: [
      { productId: p8.id, url: 'https://images.unsplash.com/photo-1602523069025-d07317603ccc?w=800&h=800&fit=crop', altText: 'Wooden elephant', isPrimary: true, sortOrder: 0 },
    ],
  });

  await prisma.productVariant.deleteMany({ where: { productId: p8.id } });
  await prisma.productVariant.createMany({
    data: [
      { productId: p8.id, sku: 'WOD-ELE-SM', name: 'Small (15cm)', price: 89.00, stock: 30, attributes: JSON.stringify({ size: '15cm' }) },
      { productId: p8.id, sku: 'WOD-ELE-LG', name: 'Large (30cm)', price: 189.00, stock: 12, attributes: JSON.stringify({ size: '30cm' }) },
    ],
  });

  console.log('✅ Products seeded');
}

async function seedBuyerAddress() {
  console.log('📍 Seeding buyer address...');

  const buyer = await prisma.user.findUnique({ where: { email: 'buyer@gmail.com' } });
  if (!buyer) throw new Error('Buyer not found');

  // Check if address already exists
  const existingAddress = await prisma.address.findFirst({
    where: {
      userId: buyer.id,
      label: 'home',
    },
  });

  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: buyer.id,
        label: 'home',
        fullName: 'John Doe',
        addressLine1: '123 Main Street',
        addressLine2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        phone: '+12125551234',
        isDefault: true,
      },
    });
  }

  console.log('✅ Buyer address seeded');
}

async function seedSampleOrder() {
  console.log('📦 Seeding sample order...');

  const buyer = await prisma.user.findUnique({ where: { email: 'buyer@gmail.com' }, include: { addresses: true } });
  const vendor1 = await prisma.user.findUnique({ where: { email: 'vendor1@ceylonspice.lk' } });
  const vendor2 = await prisma.user.findUnique({ where: { email: 'vendor2@rajtextiles.in' } });

  if (!buyer || !vendor1 || !vendor2 || buyer.addresses.length === 0) {
    throw new Error('Required data not found');
  }

  const products = await prisma.product.findMany({
    where: {
      slug: { in: ['premium-ceylon-cinnamon-alba', 'handloom-silk-saree-kanchipuram'] },
    },
    include: { variants: true },
  });

  if (products.length !== 2) throw new Error('Products not found');

  const cinnamonProduct = products.find(p => p.slug === 'premium-ceylon-cinnamon-alba');
  const sareeProduct = products.find(p => p.slug === 'handloom-silk-saree-kanchipuram');

  if (!cinnamonProduct || !sareeProduct) throw new Error('Products not found');

  const cinnamonVariant = cinnamonProduct.variants[0]; // 100g Pack
  const sareeVariant = sareeProduct.variants[0]; // Royal Red

  const orderDate = new Date('2026-04-01T10:30:00Z');
  const deliveredDate = new Date('2026-04-08T14:20:00Z');

  const subtotal = cinnamonVariant.price.toNumber() * 2 + sareeVariant.price.toNumber();
  const shippingCost = 15.00;
  const totalAmount = subtotal + shippingCost;

  const order = await prisma.order.upsert({
    where: { orderNumber: 'LM-20260401-0001' },
    update: {},
    create: {
      orderNumber: 'LM-20260401-0001',
      buyerId: buyer.id,
      shippingAddrId: buyer.addresses[0].id,
      status: OrderStatus.DELIVERED,
      subtotal,
      shippingCost,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount,
      currency: 'USD',
      deliveredAt: deliveredDate,
      createdAt: orderDate,
    },
  });

  // Delete existing order items to avoid duplicates on re-run
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });

  const orderItem1 = await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: cinnamonProduct.id,
      variantId: cinnamonVariant.id,
      vendorId: vendor1.id,
      quantity: 2,
      unitPrice: cinnamonVariant.price,
      totalPrice: cinnamonVariant.price.toNumber() * 2,
      currency: 'USD',
      status: OrderStatus.DELIVERED,
      deliveredAt: deliveredDate,
      createdAt: orderDate,
    },
  });

  const orderItem2 = await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: sareeProduct.id,
      variantId: sareeVariant.id,
      vendorId: vendor2.id,
      quantity: 1,
      unitPrice: sareeVariant.price,
      totalPrice: sareeVariant.price,
      currency: 'USD',
      status: OrderStatus.DELIVERED,
      deliveredAt: deliveredDate,
      createdAt: orderDate,
    },
  });

  // Payment
  await prisma.payment.upsert({
    where: { orderId: order.id },
    update: {},
    create: {
      orderId: order.id,
      method: PaymentMethod.STRIPE_CARD,
      status: PaymentStatus.COMPLETED,
      amount: totalAmount,
      currency: 'USD',
      stripePaymentId: 'pi_test_' + Math.random().toString(36).substring(7),
      paidAt: orderDate,
      createdAt: orderDate,
    },
  });

  console.log('✅ Sample order seeded');
  return { orderItem1, orderItem2, buyer };
}

async function seedReviews(orderData: { orderItem1: any; orderItem2: any; buyer: any }) {
  console.log('⭐ Seeding reviews...');

  const { orderItem1, orderItem2, buyer } = orderData;

  const reviewDate1 = new Date('2026-04-10T16:45:00Z');
  const reviewDate2 = new Date('2026-04-11T09:30:00Z');
  const reviewDate3 = new Date('2026-04-12T11:15:00Z');

  // Review 1: Cinnamon product
  const review1Exists = await prisma.review.findFirst({
    where: {
      authorId: buyer.id,
      productId: orderItem1.productId,
      title: 'Absolutely Amazing Quality!',
    },
  });

  if (!review1Exists) {
    await prisma.review.create({
      data: {
        authorId: buyer.id,
        productId: orderItem1.productId,
        orderItemId: orderItem1.id,
        rating: 5,
        title: 'Absolutely Amazing Quality!',
        content: 'This is the best Ceylon cinnamon I have ever purchased. The aroma is incredible and the flavor is so delicate and sweet. You can really tell the difference between this and the cassia cinnamon sold in most stores. Will definitely order again!',
        isVerified: true,
        createdAt: reviewDate1,
      },
    });
  }

  // Review 2: Saree product
  const review2Exists = await prisma.review.findFirst({
    where: {
      authorId: buyer.id,
      productId: orderItem2.productId,
      title: 'Beautiful Saree, Minor Packaging Issue',
    },
  });

  if (!review2Exists) {
    await prisma.review.create({
      data: {
        authorId: buyer.id,
        productId: orderItem2.productId,
        orderItemId: orderItem2.id,
        rating: 4,
        title: 'Beautiful Saree, Minor Packaging Issue',
        content: 'The saree itself is absolutely stunning - the silk quality and zari work are exceptional. The color is vibrant and true to the photos. However, the packaging was a bit damaged during shipping. Overall very happy with the purchase!',
        isVerified: true,
        createdAt: reviewDate2,
      },
    });
  }

  // Review 3: Another product (tea) - simulated verified purchase
  const teaProduct = await prisma.product.findUnique({
    where: { slug: 'organic-ceylon-black-tea-bop' },
  });

  if (teaProduct) {
    // Check if any review exists for this product by this buyer (to avoid duplicates)
    const review3Exists = await prisma.review.findFirst({
      where: {
        authorId: buyer.id,
        productId: teaProduct.id,
        title: 'Perfect Morning Tea',
      },
    });

    if (!review3Exists) {
      await prisma.review.create({
        data: {
          authorId: buyer.id,
          productId: teaProduct.id,
          orderItemId: orderItem1.id,
          rating: 5,
          title: 'Perfect Morning Tea',
          content: 'Rich, full-bodied flavor that wakes you up in the morning. The golden liquor and bright taste make this my new favorite black tea. Highly recommend!',
          isVerified: true,
          createdAt: reviewDate3,
        },
      });
    }
  }

  console.log('✅ Reviews seeded');
}

async function seedPlatformSettings() {
  console.log('⚙️  Seeding platform settings...');

  const settings = [
    { key: 'platform_name', value: 'LankaMart', type: 'string', group: 'general', label: 'Platform Name' },
    { key: 'default_currency', value: 'USD', type: 'string', group: 'general', label: 'Default Currency' },
    { key: 'default_commission_rate', value: '5.00', type: 'number', group: 'payment', label: 'Default Commission Rate (%)' },
    { key: 'min_payout_amount', value: '50.00', type: 'number', group: 'payment', label: 'Minimum Payout Amount' },
    { key: 'support_email', value: 'support@lankamart.com', type: 'string', group: 'general', label: 'Support Email' },
  ];

  for (const setting of settings) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('✅ Platform settings seeded');
}

async function seedExchangeRates() {
  console.log('💱 Seeding exchange rates...');

  // Use a fixed date for idempotency
  const fetchedAt = new Date('2026-04-05T00:00:00Z');

  const rates = [
    { baseCurrency: 'USD', currency: 'LKR', rate: 323.50 },
    { baseCurrency: 'USD', currency: 'INR', rate: 83.25 },
    { baseCurrency: 'USD', currency: 'GBP', rate: 0.79 },
  ];

  for (const rate of rates) {
    await prisma.exchangeRate.upsert({
      where: {
        baseCurrency_currency_fetchedAt: {
          baseCurrency: rate.baseCurrency,
          currency: rate.currency,
          fetchedAt,
        },
      },
      update: {},
      create: {
        baseCurrency: rate.baseCurrency,
        currency: rate.currency,
        rate: rate.rate,
        source: 'manual_seed',
        fetchedAt,
      },
    });
  }

  console.log('✅ Exchange rates seeded');
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    await hashPasswords();
    await seedUsers();
    await seedVendorProfiles();
    await seedCategories();
    await seedProducts();
    await seedBuyerAddress();
    const orderData = await seedSampleOrder();
    await seedReviews(orderData);
    await seedPlatformSettings();
    await seedExchangeRates();

    console.log('\n🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
