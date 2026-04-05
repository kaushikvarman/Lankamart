import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '@/common/prisma/prisma.service';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

const MOCK_ROOT_ID = 'cat-root-001';
const MOCK_SUB_ID = 'cat-sub-001';
const MOCK_SUB_SUB_ID = 'cat-subsub-001';

const mockRootCategory = {
  id: MOCK_ROOT_ID,
  name: 'Electronics',
  slug: 'electronics-abc123',
  description: 'Electronic devices and accessories',
  imageUrl: null,
  parentId: null,
  sortOrder: 0,
  isActive: true,
  commission: new Decimal('7.50'),
  hsCode: '8471',
  gstRate: new Decimal('18.00'),
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  _count: { children: 2, products: 10 },
};

const mockSubCategory = {
  id: MOCK_SUB_ID,
  name: 'Smartphones',
  slug: 'smartphones-def456',
  description: 'Mobile phones',
  imageUrl: null,
  parentId: MOCK_ROOT_ID,
  parent: { id: MOCK_ROOT_ID, parentId: null },
  sortOrder: 0,
  isActive: true,
  commission: null,
  hsCode: null,
  gstRate: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  _count: { children: 1, products: 5 },
};

const mockSubSubCategory = {
  id: MOCK_SUB_SUB_ID,
  name: 'Android Phones',
  slug: 'android-phones-ghi789',
  description: null,
  imageUrl: null,
  parentId: MOCK_SUB_ID,
  parent: { id: MOCK_SUB_ID, parentId: MOCK_ROOT_ID },
  sortOrder: 0,
  isActive: true,
  commission: null,
  hsCode: null,
  gstRate: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  _count: { children: 0, products: 3 },
};

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: {
    category: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      category: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    const dto: CreateCategoryDto = {
      name: 'Electronics',
      description: 'Electronic devices and accessories',
      commission: '7.50',
      hsCode: '8471',
      gstRate: '18.00',
    };

    it('should create a root category successfully', async () => {
      prisma.category.create.mockResolvedValue(mockRootCategory);

      const result = await service.create(dto);

      expect(result.name).toBe('Electronics');
      expect(result.commission).toBe(7.5);
      expect(result.gstRate).toBe(18);
      expect(result.childCount).toBe(2);
      expect(result.productCount).toBe(10);
      expect(prisma.category.create).toHaveBeenCalledTimes(1);

      const createCall = prisma.category.create.mock.calls[0][0];
      expect(createCall.data.name).toBe('Electronics');
      expect(createCall.data.slug).toMatch(/^electronics-[a-f0-9]{6}$/);
    });

    it('should use provided slug instead of generating one', async () => {
      prisma.category.create.mockResolvedValue({
        ...mockRootCategory,
        slug: 'custom-slug',
      });

      await service.create({ ...dto, slug: 'custom-slug' });

      const createCall = prisma.category.create.mock.calls[0][0];
      expect(createCall.data.slug).toBe('custom-slug');
    });

    it('should create a subcategory with valid parent', async () => {
      prisma.category.findUnique.mockResolvedValue({
        id: MOCK_ROOT_ID,
        parentId: null,
        parent: null,
      });
      prisma.category.create.mockResolvedValue(mockSubCategory);

      const result = await service.create({
        name: 'Smartphones',
        parentId: MOCK_ROOT_ID,
      });

      expect(result.parentId).toBe(MOCK_ROOT_ID);
    });

    it('should throw NotFoundException for invalid parentId', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ name: 'Test', parentId: 'nonexistent-id' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if exceeding 3 levels', async () => {
      prisma.category.findUnique.mockResolvedValue({
        id: MOCK_SUB_SUB_ID,
        parentId: MOCK_SUB_ID,
        parent: { id: MOCK_SUB_ID, parentId: MOCK_ROOT_ID },
      });

      await expect(
        service.create({ name: 'Too Deep', parentId: MOCK_SUB_SUB_ID }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException on duplicate slug', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' },
      );
      prisma.category.create.mockRejectedValue(prismaError);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  // ---------------------------------------------------------------------------
  // findAll
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return root categories when no parentId specified', async () => {
      prisma.category.findMany.mockResolvedValue([mockRootCategory]);

      const result = await service.findAll({});

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Electronics');

      const findManyCall = prisma.category.findMany.mock.calls[0]![0];
      expect(findManyCall.where.parentId).toBeNull();
    });

    it('should filter by parentId', async () => {
      prisma.category.findMany.mockResolvedValue([
        { ...mockSubCategory, _count: { children: 1, products: 5 } },
      ]);

      const result = await service.findAll({ parentId: MOCK_ROOT_ID });

      expect(result).toHaveLength(1);
      const findManyCall = prisma.category.findMany.mock.calls[0][0];
      expect(findManyCall.where.parentId).toBe(MOCK_ROOT_ID);
    });

    it('should filter by search term', async () => {
      prisma.category.findMany.mockResolvedValue([mockRootCategory]);

      await service.findAll({ search: 'elec' });

      const findManyCall = prisma.category.findMany.mock.calls[0][0];
      expect(findManyCall.where.name).toEqual({
        contains: 'elec',
        mode: 'insensitive',
      });
    });

    it('should filter by isActive', async () => {
      prisma.category.findMany.mockResolvedValue([]);

      await service.findAll({ isActive: true });

      const findManyCall = prisma.category.findMany.mock.calls[0][0];
      expect(findManyCall.where.isActive).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // getCategoryTree
  // ---------------------------------------------------------------------------
  describe('getCategoryTree', () => {
    it('should return a full category tree with nested children', async () => {
      const treeData = [
        {
          ...mockRootCategory,
          children: [
            {
              ...mockSubCategory,
              parent: undefined,
              children: [
                {
                  ...mockSubSubCategory,
                  parent: undefined,
                  _count: { children: 0, products: 3 },
                },
              ],
            },
          ],
        },
      ];
      prisma.category.findMany.mockResolvedValue(treeData);

      const result = await service.getCategoryTree();

      expect(result).toHaveLength(1);
      expect(result[0]!.children).toHaveLength(1);
      expect(result[0]!.children![0]!.children).toHaveLength(1);
      expect(result[0]!.children![0]!.children![0]!.name).toBe('Android Phones');
    });

    it('should return empty array when no categories exist', async () => {
      prisma.category.findMany.mockResolvedValue([]);

      const result = await service.getCategoryTree();

      expect(result).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should update a category', async () => {
      prisma.category.findUnique.mockResolvedValue(mockRootCategory);
      prisma.category.update.mockResolvedValue({
        ...mockRootCategory,
        description: 'Updated description',
      });

      const result = await service.update(MOCK_ROOT_ID, {
        description: 'Updated description',
      });

      expect(result.description).toBe('Updated description');
    });

    it('should regenerate slug when name changes and no slug provided', async () => {
      prisma.category.findUnique.mockResolvedValue(mockRootCategory);
      prisma.category.update.mockResolvedValue({
        ...mockRootCategory,
        name: 'Gadgets',
        slug: 'gadgets-abc123',
      });

      await service.update(MOCK_ROOT_ID, { name: 'Gadgets' });

      const updateCall = prisma.category.update.mock.calls[0][0];
      expect(updateCall.data.slug).toMatch(/^gadgets-[a-f0-9]{6}$/);
      expect(updateCall.data.name).toBe('Gadgets');
    });

    it('should not regenerate slug when name unchanged', async () => {
      prisma.category.findUnique.mockResolvedValue(mockRootCategory);
      prisma.category.update.mockResolvedValue({
        ...mockRootCategory,
        description: 'New desc',
      });

      await service.update(MOCK_ROOT_ID, { description: 'New desc' });

      const updateCall = prisma.category.update.mock.calls[0][0];
      expect(updateCall.data.slug).toBeUndefined();
    });

    it('should throw NotFoundException if category not found', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if category is set as its own parent', async () => {
      prisma.category.findUnique
        .mockResolvedValueOnce(mockRootCategory)
        .mockResolvedValueOnce({ id: MOCK_ROOT_ID, parentId: null, parent: null });

      await expect(
        service.update(MOCK_ROOT_ID, { parentId: MOCK_ROOT_ID }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------
  describe('delete', () => {
    it('should deactivate a category with no active products', async () => {
      prisma.category.findUnique.mockResolvedValue({
        ...mockRootCategory,
        _count: { products: 0 },
      });
      prisma.category.update.mockResolvedValue({
        ...mockRootCategory,
        isActive: false,
      });

      const result = await service.delete(MOCK_ROOT_ID);

      expect(result.message).toContain('deactivated');
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: MOCK_ROOT_ID },
        data: { isActive: false },
      });
    });

    it('should throw BadRequestException if category has active products', async () => {
      prisma.category.findUnique.mockResolvedValue({
        ...mockRootCategory,
        _count: { products: 5 },
      });

      await expect(service.delete(MOCK_ROOT_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if category not found', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
