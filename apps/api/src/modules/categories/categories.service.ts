import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { generateSlug } from '@/common/utils/slug';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
  QueryCategoriesDto,
} from './dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
        include: { parent: true },
      });

      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID "${dto.parentId}" not found`,
        );
      }

      if (parent.parent?.parentId) {
        throw new BadRequestException(
          'Categories support a maximum of 3 levels of nesting',
        );
      }
    }

    const slug = dto.slug ?? generateSlug(dto.name);

    let category;
    try {
      category = await this.prisma.category.create({
        data: {
          name: dto.name,
          slug,
          description: dto.description,
          imageUrl: dto.imageUrl,
          parentId: dto.parentId,
          sortOrder: dto.sortOrder ?? 0,
          commission: dto.commission ? new Prisma.Decimal(dto.commission) : undefined,
          hsCode: dto.hsCode,
          gstRate: dto.gstRate ? new Prisma.Decimal(dto.gstRate) : undefined,
        },
        include: {
          _count: {
            select: { children: true, products: true },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `A category with slug "${slug}" already exists`,
        );
      }
      throw error;
    }

    this.logger.log(`Category created: ${category.name} (${category.id})`);
    return CategoryResponseDto.fromEntity(category);
  }

  async findAll(query: QueryCategoriesDto): Promise<CategoryResponseDto[]> {
    const where: Prisma.CategoryWhereInput = {};

    if (query.parentId) {
      where.parentId = query.parentId;
    } else if (query.parentId === undefined) {
      where.parentId = null;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const categories = await this.prisma.category.findMany({
      where,
      include: {
        _count: {
          select: { children: true, products: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return categories.map((cat) => CategoryResponseDto.fromEntity(cat));
  }

  async findById(id: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: {
          include: {
            _count: {
              select: { children: true, products: true },
            },
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
        attributes: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { children: true, products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return CategoryResponseDto.fromEntity(category);
  }

  async findBySlug(slug: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          where: { isActive: true },
          include: {
            _count: {
              select: { children: true, products: true },
            },
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
        attributes: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { children: true, products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    return CategoryResponseDto.fromEntity(category);
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
        include: { parent: true },
      });

      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID "${dto.parentId}" not found`,
        );
      }

      if (dto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }

      if (parent.parent?.parentId) {
        throw new BadRequestException(
          'Categories support a maximum of 3 levels of nesting',
        );
      }
    }

    const shouldRegenerateSlug =
      dto.name && dto.name !== existing.name && !dto.slug;
    const slug = dto.slug ?? (shouldRegenerateSlug ? generateSlug(dto.name!) : undefined);

    let category;
    try {
      category = await this.prisma.category.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(slug !== undefined && { slug }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
          ...(dto.parentId !== undefined && { parentId: dto.parentId }),
          ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
          ...(dto.commission !== undefined && {
            commission: dto.commission
              ? new Prisma.Decimal(dto.commission)
              : null,
          }),
          ...(dto.hsCode !== undefined && { hsCode: dto.hsCode }),
          ...(dto.gstRate !== undefined && {
            gstRate: dto.gstRate
              ? new Prisma.Decimal(dto.gstRate)
              : null,
          }),
        },
        include: {
          _count: {
            select: { children: true, products: true },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `A category with slug "${slug}" already exists`,
        );
      }
      throw error;
    }

    this.logger.log(`Category updated: ${category.name} (${category.id})`);
    return CategoryResponseDto.fromEntity(category);
  }

  async delete(id: string): Promise<{ message: string }> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: {
              where: {
                status: { in: ['ACTIVE', 'PENDING_REVIEW', 'PAUSED'] },
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    if ((category._count?.products ?? 0) > 0) {
      throw new BadRequestException(
        'Cannot deactivate a category that has active products. Move or remove products first.',
      );
    }

    await this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.warn(`Category deactivated: ${category.name} (${id})`);
    return { message: `Category "${category.name}" has been deactivated` };
  }

  async getCategoryTree(): Promise<CategoryResponseDto[]> {
    const rootCategories = await this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        _count: {
          select: { children: true, products: true },
        },
        children: {
          where: { isActive: true },
          include: {
            _count: {
              select: { children: true, products: true },
            },
            children: {
              where: { isActive: true },
              include: {
                _count: {
                  select: { children: true, products: true },
                },
              },
              orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            },
          },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return rootCategories.map((cat) => CategoryResponseDto.fromEntity(cat));
  }
}
