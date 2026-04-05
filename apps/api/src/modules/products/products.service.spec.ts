import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductSortBy } from './dto/query-products.dto';

const MOCK_VENDOR_ID = 'vendor-001';
const MOCK_OTHER_VENDOR_ID = 'vendor-002';
const MOCK_PRODUCT_ID = 'product-001';
const MOCK_CATEGORY_ID = 'category-001';
const MOCK_IMAGE_ID = 'image-001';
const MOCK_VARIANT_ID = 'variant-001';

const mockCategory = {
  id: MOCK_CATEGORY_ID,
  name: 'Spices',
  slug: 'spices-abc123',
  description: null,
  imageUrl: null,
  parentId: null,
  sortOrder: 0,
  isActive: true,
  commission: null,
  hsCode: null,
  gstRate: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockProduct = {
  id: MOCK_PRODUCT_ID,
  vendorId: MOCK_VENDOR_ID,
  categoryId: MOCK_CATEGORY_ID,
  name: 'Ceylon Cinnamon',
  slug: 'ceylon-cinnamon-abc123',
  description: 'Premium Ceylon cinnamon sticks',
  shortDesc: 'Grade A cinnamon',
  status: ProductStatus.DRAFT,
  baseCurrency: 'USD',
  basePrice: new Decimal('29.99'),
  comparePrice: new Decimal('39.99'),
  costPrice: null,
  moq: 1,
  maxQty: null,
  unit: 'piece',
  weight: new Decimal('0.500'),
  length: null,
  width: null,
  height: null,
  hsCode: '0906.11',
  originCountry: 'LK',
  tags: '["organic","premium"]',
  isFeatured: false,
  averageRating: new Decimal('0'),
  totalReviews: 0,
  totalSold: 0,
  viewCount: 0,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  deletedAt: null,
};

const mockProductImage = {
  id: MOCK_IMAGE_ID,
  productId: MOCK_PRODUCT_ID,
  url: 'https://storage.example.com/cinnamon.jpg',
  altText: 'Cinnamon sticks',
  sortOrder: 0,
  isPrimary: true,
};

const mockProductVariant = {
  id: MOCK_VARIANT_ID,
  productId: MOCK_PRODUCT_ID,
  sku: 'CIN-100G',
  name: '100g Pack',
  price: new Decimal('29.99'),
  stock: 100,
  lowStockAt: 5,
  weight: new Decimal('0.100'),
  imageUrl: null,
  attributes: '{"weight":"100g"}',
  isActive: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockBulkTier = {
  id: 'tier-001',
  productId: MOCK_PRODUCT_ID,
  minQty: 10,
  maxQty: 49,
  price: new Decimal('24.99'),
};

const mockVendorProfile = {
  id: 'vp-001',
  businessName: 'Ceylon Spices Co.',
  businessSlug: 'ceylon-spices-co-abc123',
  isVerified: true,
};

const mockProductFull = {
  ...mockProduct,
  images: [mockProductImage],
  variants: [mockProductVariant],
  bulkPricingTiers: [mockBulkTier],
  category: mockCategory,
  vendor: { vendorProfile: mockVendorProfile },
};

const mockProductList = {
  ...mockProduct,
  images: [mockProductImage],
  category: mockCategory,
  vendor: { vendorProfile: mockVendorProfile },
};

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    category: { findUnique: jest.Mock };
    product: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    productImage: {
      createMany: jest.Mock;
      deleteMany: jest.Mock;
      updateMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    productVariant: {
      createMany: jest.Mock;
      deleteMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    bulkPricingTier: { createMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      category: { findUnique: jest.fn() },
      product: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      productImage: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      productVariant: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      bulkPricingTier: { createMany: jest.fn() },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    const dto: CreateProductDto = {
      name: 'Ceylon Cinnamon',
      categoryId: MOCK_CATEGORY_ID,
      description: 'Premium Ceylon cinnamon sticks',
      shortDesc: 'Grade A cinnamon',
      basePrice: '29.99',
      comparePrice: '39.99',
      originCountry: 'LK',
      hsCode: '0906.11',
      tags: ['organic', 'premium'],
      images: [
        { url: 'https://storage.example.com/cinnamon.jpg', altText: 'Cinnamon', isPrimary: true },
      ],
      variants: [
        {
          sku: 'CIN-100G',
          name: '100g Pack',
          price: '29.99',
          stock: 100,
          attributes: { weight: '100g' },
        },
      ],
      bulkPricing: [
        { minQty: 10, maxQty: 49, price: '24.99' },
        { minQty: 50, price: '19.99' },
      ],
    };

    it('should create a product with images, variants, and bulk pricing in a transaction', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);
      prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<typeof mockProductFull>) => {
        return fn(prisma);
      });
      prisma.product.create.mockResolvedValue({ id: MOCK_PRODUCT_ID });
      prisma.productImage.createMany.mockResolvedValue({ count: 1 });
      prisma.productVariant.createMany.mockResolvedValue({ count: 1 });
      prisma.bulkPricingTier.createMany.mockResolvedValue({ count: 2 });
      prisma.product.findUniqueOrThrow.mockResolvedValue(mockProductFull);

      const result = await service.create(MOCK_VENDOR_ID, dto);

      expect(result.name).toBe('Ceylon Cinnamon');
      expect(result.basePrice).toBe(29.99);
      expect(result.comparePrice).toBe(39.99);
      expect(result.images).toHaveLength(1);
      expect(result.variants).toHaveLength(1);
      expect(result.bulkPricing).toHaveLength(1);
      expect(result.vendor?.businessName).toBe('Ceylon Spices Co.');

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.product.create).toHaveBeenCalledTimes(1);
      expect(prisma.productImage.createMany).toHaveBeenCalledTimes(1);
      expect(prisma.productVariant.createMany).toHaveBeenCalledTimes(1);
      expect(prisma.bulkPricingTier.createMany).toHaveBeenCalledTimes(1);

      const createCall = prisma.product.create.mock.calls[0][0];
      expect(createCall.data.vendorId).toBe(MOCK_VENDOR_ID);
      expect(createCall.data.status).toBe(ProductStatus.DRAFT);
      expect(createCall.data.slug).toMatch(/^ceylon-cinnamon-[a-f0-9]{6}$/);
    });

    it('should throw NotFoundException for invalid categoryId', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.create(MOCK_VENDOR_ID, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for inactive category', async () => {
      prisma.category.findUnique.mockResolvedValue({
        ...mockCategory,
        isActive: false,
      });

      await expect(
        service.create(MOCK_VENDOR_ID, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid bulk pricing (overlapping tiers)', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);

      const invalidDto: CreateProductDto = {
        ...dto,
        bulkPricing: [
          { minQty: 10, maxQty: 50, price: '24.99' },
          { minQty: 40, maxQty: 100, price: '19.99' },
        ],
      };

      await expect(
        service.create(MOCK_VENDOR_ID, invalidDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when non-last tier has no maxQty', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);

      const invalidDto: CreateProductDto = {
        ...dto,
        bulkPricing: [
          { minQty: 10, price: '24.99' },
          { minQty: 50, price: '19.99' },
        ],
      };

      await expect(
        service.create(MOCK_VENDOR_ID, invalidDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle slug conflict in transaction', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' },
      );
      prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<typeof mockProductFull>) => {
        return fn(prisma);
      });
      prisma.product.create.mockRejectedValue(prismaError);

      await expect(
        service.create(MOCK_VENDOR_ID, dto),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ---------------------------------------------------------------------------
  // findBySlug
  // ---------------------------------------------------------------------------
  describe('findBySlug', () => {
    it('should return an active product and increment view count', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...mockProductFull,
        status: ProductStatus.ACTIVE,
      });
      prisma.product.update.mockResolvedValue({ viewCount: 1 });

      const result = await service.findBySlug('ceylon-cinnamon-abc123');

      expect(result.name).toBe('Ceylon Cinnamon');
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: MOCK_PRODUCT_ID },
        data: { viewCount: { increment: 1 } },
      });
    });

    it('should throw NotFoundException for non-ACTIVE products', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...mockProductFull,
        status: ProductStatus.DRAFT,
      });

      await expect(
        service.findBySlug('ceylon-cinnamon-abc123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for deleted products', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...mockProductFull,
        status: ProductStatus.ACTIVE,
        deletedAt: new Date(),
      });

      await expect(
        service.findBySlug('ceylon-cinnamon-abc123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-existent slug', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.findBySlug('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // listProducts
  // ---------------------------------------------------------------------------
  describe('listProducts', () => {
    it('should return paginated active products for public access', async () => {
      prisma.product.findMany.mockResolvedValue([mockProductList]);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.listProducts({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);

      const findCall = prisma.product.findMany.mock.calls[0][0];
      expect(findCall.where.status).toBe(ProductStatus.ACTIVE);
    });

    it('should allow admin to see all statuses', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.listProducts(
        { page: 1, limit: 20, status: ProductStatus.DRAFT },
        UserRole.ADMIN,
      );

      const findCall = prisma.product.findMany.mock.calls[0][0];
      expect(findCall.where.status).toBe(ProductStatus.DRAFT);
    });

    it('should filter vendor products by vendorId', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.listProducts(
        { page: 1, limit: 20 },
        UserRole.VENDOR,
        MOCK_VENDOR_ID,
      );

      const findCall = prisma.product.findMany.mock.calls[0][0];
      expect(findCall.where.vendorId).toBe(MOCK_VENDOR_ID);
    });

    it('should apply price filters', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.listProducts({
        page: 1,
        limit: 20,
        minPrice: 10,
        maxPrice: 100,
      });

      const findCall = prisma.product.findMany.mock.calls[0][0];
      expect(findCall.where.basePrice).toEqual({ gte: 10, lte: 100 });
    });

    it('should apply search filter', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.listProducts({ page: 1, limit: 20, search: 'cinnamon' });

      const findCall = prisma.product.findMany.mock.calls[0][0];
      expect(findCall.where.OR).toBeDefined();
      expect(findCall.where.OR[0].name).toEqual({
        contains: 'cinnamon',
        mode: 'insensitive',
      });
    });

    it('should sort by price ascending', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.listProducts({
        page: 1,
        limit: 20,
        sortBy: ProductSortBy.PRICE_ASC,
      });

      const findCall = prisma.product.findMany.mock.calls[0][0];
      expect(findCall.orderBy).toEqual([{ basePrice: 'asc' }]);
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should update a product owned by the vendor', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({
        ...mockProductFull,
        shortDesc: 'Updated desc',
      });

      const result = await service.update(MOCK_VENDOR_ID, MOCK_PRODUCT_ID, {
        shortDesc: 'Updated desc',
      });

      expect(result.shortDesc).toBe('Updated desc');
    });

    it('should throw ForbiddenException if vendor does not own the product', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      await expect(
        service.update(MOCK_OTHER_VENDOR_ID, MOCK_PRODUCT_ID, {
          shortDesc: 'test',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.update(MOCK_VENDOR_ID, 'nonexistent', { shortDesc: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reset status to DRAFT when updating a REJECTED product', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        status: ProductStatus.REJECTED,
      });
      prisma.product.update.mockResolvedValue({
        ...mockProductFull,
        status: ProductStatus.DRAFT,
      });

      await service.update(MOCK_VENDOR_ID, MOCK_PRODUCT_ID, {
        shortDesc: 'Fixed',
      });

      const updateCall = prisma.product.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe(ProductStatus.DRAFT);
    });

    it('should regenerate slug when name changes', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({
        ...mockProductFull,
        name: 'New Product Name',
        slug: 'new-product-name-abc123',
      });

      await service.update(MOCK_VENDOR_ID, MOCK_PRODUCT_ID, {
        name: 'New Product Name',
      });

      const updateCall = prisma.product.update.mock.calls[0][0];
      expect(updateCall.data.slug).toMatch(/^new-product-name-[a-f0-9]{6}$/);
    });
  });

  // ---------------------------------------------------------------------------
  // updateStatus
  // ---------------------------------------------------------------------------
  describe('updateStatus', () => {
    it('should update product status to ACTIVE', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({
        ...mockProductFull,
        status: ProductStatus.ACTIVE,
      });

      const result = await service.updateStatus(
        MOCK_PRODUCT_ID,
        ProductStatus.ACTIVE,
      );

      expect(result.status).toBe(ProductStatus.ACTIVE);
    });

    it('should reject a product with admin note', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({
        ...mockProductFull,
        status: ProductStatus.REJECTED,
      });

      const result = await service.updateStatus(
        MOCK_PRODUCT_ID,
        ProductStatus.REJECTED,
        'Images are misleading',
      );

      expect(result.status).toBe(ProductStatus.REJECTED);
    });

    it('should throw NotFoundException if product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('nonexistent', ProductStatus.ACTIVE),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for disallowed status', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      await expect(
        service.updateStatus(MOCK_PRODUCT_ID, ProductStatus.DRAFT),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe('delete', () => {
    it('should soft delete a product owned by the vendor', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({
        ...mockProduct,
        deletedAt: new Date(),
      });

      const result = await service.delete(MOCK_VENDOR_ID, MOCK_PRODUCT_ID);

      expect(result.message).toContain('deleted');
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: MOCK_PRODUCT_ID },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw ForbiddenException if vendor does not own the product', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      await expect(
        service.delete(MOCK_OTHER_VENDOR_ID, MOCK_PRODUCT_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.delete(MOCK_VENDOR_ID, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // manageImages
  // ---------------------------------------------------------------------------
  describe('manageImages', () => {
    it('should add images to a product', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        images: [mockProductImage],
      });
      prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<void>) => {
        return fn(prisma);
      });
      prisma.productImage.createMany.mockResolvedValue({ count: 1 });
      prisma.product.findUniqueOrThrow.mockResolvedValue(mockProductFull);

      const result = await service.manageImages(MOCK_VENDOR_ID, MOCK_PRODUCT_ID, {
        addImages: [{ url: 'https://example.com/new.jpg', altText: 'New image' }],
      });

      expect(result.images).toHaveLength(1);
      expect(prisma.productImage.createMany).toHaveBeenCalledTimes(1);
    });

    it('should remove images from a product', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        images: [mockProductImage],
      });
      prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<void>) => {
        return fn(prisma);
      });
      prisma.productImage.deleteMany.mockResolvedValue({ count: 1 });
      prisma.product.findUniqueOrThrow.mockResolvedValue({
        ...mockProductFull,
        images: [],
      });

      await service.manageImages(MOCK_VENDOR_ID, MOCK_PRODUCT_ID, {
        removeImageIds: [MOCK_IMAGE_ID],
      });

      expect(prisma.productImage.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [MOCK_IMAGE_ID] }, productId: MOCK_PRODUCT_ID },
      });
    });

    it('should set primary image', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        images: [mockProductImage],
      });
      prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<void>) => {
        return fn(prisma);
      });
      prisma.productImage.updateMany.mockResolvedValue({ count: 1 });
      prisma.productImage.findFirst.mockResolvedValue(mockProductImage);
      prisma.productImage.update.mockResolvedValue({
        ...mockProductImage,
        isPrimary: true,
      });
      prisma.product.findUniqueOrThrow.mockResolvedValue(mockProductFull);

      await service.manageImages(MOCK_VENDOR_ID, MOCK_PRODUCT_ID, {
        setPrimaryImageId: MOCK_IMAGE_ID,
      });

      expect(prisma.productImage.updateMany).toHaveBeenCalledWith({
        where: { productId: MOCK_PRODUCT_ID, isPrimary: true },
        data: { isPrimary: false },
      });
      expect(prisma.productImage.update).toHaveBeenCalledWith({
        where: { id: MOCK_IMAGE_ID },
        data: { isPrimary: true },
      });
    });

    it('should throw ForbiddenException if vendor does not own the product', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        images: [mockProductImage],
      });

      await expect(
        service.manageImages(MOCK_OTHER_VENDOR_ID, MOCK_PRODUCT_ID, {
          addImages: [{ url: 'https://example.com/new.jpg' }],
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ---------------------------------------------------------------------------
  // manageVariants
  // ---------------------------------------------------------------------------
  describe('manageVariants', () => {
    it('should add variants to a product', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<void>) => {
        return fn(prisma);
      });
      prisma.productVariant.createMany.mockResolvedValue({ count: 1 });
      prisma.product.findUniqueOrThrow.mockResolvedValue(mockProductFull);

      const result = await service.manageVariants(MOCK_VENDOR_ID, MOCK_PRODUCT_ID, {
        addVariants: [
          {
            sku: 'CIN-200G',
            name: '200g Pack',
            price: '49.99',
            stock: 50,
            attributes: { weight: '200g' },
          },
        ],
      });

      expect(result.variants).toHaveLength(1);
      expect(prisma.productVariant.createMany).toHaveBeenCalledTimes(1);
    });

    it('should remove variants from a product', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<void>) => {
        return fn(prisma);
      });
      prisma.productVariant.deleteMany.mockResolvedValue({ count: 1 });
      prisma.product.findUniqueOrThrow.mockResolvedValue({
        ...mockProductFull,
        variants: [],
      });

      await service.manageVariants(MOCK_VENDOR_ID, MOCK_PRODUCT_ID, {
        removeVariantIds: [MOCK_VARIANT_ID],
      });

      expect(prisma.productVariant.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [MOCK_VARIANT_ID] }, productId: MOCK_PRODUCT_ID },
      });
    });

    it('should update existing variants', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<void>) => {
        return fn(prisma);
      });
      prisma.productVariant.findFirst.mockResolvedValue(mockProductVariant);
      prisma.productVariant.update.mockResolvedValue({
        ...mockProductVariant,
        stock: 200,
      });
      prisma.product.findUniqueOrThrow.mockResolvedValue(mockProductFull);

      await service.manageVariants(MOCK_VENDOR_ID, MOCK_PRODUCT_ID, {
        updateVariants: [
          { id: MOCK_VARIANT_ID, stock: 200 },
        ],
      });

      expect(prisma.productVariant.update).toHaveBeenCalledTimes(1);
      const updateCall = prisma.productVariant.update.mock.calls[0][0];
      expect(updateCall.data.stock).toBe(200);
    });

    it('should throw ForbiddenException if vendor does not own the product', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      await expect(
        service.manageVariants(MOCK_OTHER_VENDOR_ID, MOCK_PRODUCT_ID, {
          addVariants: [
            { sku: 'X', name: 'X', price: '10', stock: 1, attributes: {} },
          ],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException for duplicate SKU', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' },
      );
      prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<void>) => {
        return fn(prisma);
      });
      prisma.productVariant.createMany.mockRejectedValue(prismaError);

      await expect(
        service.manageVariants(MOCK_VENDOR_ID, MOCK_PRODUCT_ID, {
          addVariants: [
            { sku: 'CIN-100G', name: 'Duplicate', price: '10', stock: 1, attributes: {} },
          ],
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
