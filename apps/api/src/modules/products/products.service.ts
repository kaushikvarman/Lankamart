import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus, UserRole } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { generateSlug } from '@/common/utils/slug';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  ProductListItemDto,
  QueryProductsDto,
  ProductSortBy,
  ManageImagesDto,
  ManageVariantsDto,
} from './dto';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const PRODUCT_FULL_INCLUDE = {
  images: { orderBy: { sortOrder: 'asc' as const } },
  variants: { orderBy: { createdAt: 'asc' as const } },
  bulkPricingTiers: { orderBy: { minQty: 'asc' as const } },
  category: true,
  vendor: {
    include: {
      vendorProfile: true,
    },
  },
} as const;

const PRODUCT_LIST_INCLUDE = {
  images: {
    where: { isPrimary: true },
    take: 1,
  },
  category: true,
  vendor: {
    include: {
      vendorProfile: true,
    },
  },
} as const;

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    vendorId: string,
    dto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category || !category.isActive) {
      throw new NotFoundException(
        `Category with ID "${dto.categoryId}" not found or is inactive`,
      );
    }

    if (dto.bulkPricing && dto.bulkPricing.length > 0) {
      this.validateBulkPricing(dto.bulkPricing);
    }

    const slug = generateSlug(dto.name);

    const product = await this.prisma.$transaction(async (tx) => {
      let created;
      try {
        created = await tx.product.create({
          data: {
            vendorId,
            categoryId: dto.categoryId,
            name: dto.name,
            slug,
            description: dto.description,
            shortDesc: dto.shortDesc,
            baseCurrency: dto.baseCurrency ?? 'USD',
            basePrice: new Prisma.Decimal(dto.basePrice),
            comparePrice: dto.comparePrice
              ? new Prisma.Decimal(dto.comparePrice)
              : undefined,
            moq: dto.moq ?? 1,
            maxQty: dto.maxQty,
            unit: dto.unit ?? 'piece',
            weight: dto.weight ? new Prisma.Decimal(dto.weight) : undefined,
            length: dto.length ? new Prisma.Decimal(dto.length) : undefined,
            width: dto.width ? new Prisma.Decimal(dto.width) : undefined,
            height: dto.height ? new Prisma.Decimal(dto.height) : undefined,
            hsCode: dto.hsCode,
            originCountry: dto.originCountry,
            tags: dto.tags ? JSON.stringify(dto.tags) : undefined,
            status: ProductStatus.DRAFT,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            `A product with slug "${slug}" already exists`,
          );
        }
        throw error;
      }

      const hasPrimary = dto.images.some((img) => img.isPrimary);
      await tx.productImage.createMany({
        data: dto.images.map((img, index) => ({
          productId: created.id,
          url: img.url,
          altText: img.altText,
          sortOrder: index,
          isPrimary: hasPrimary ? (img.isPrimary ?? false) : index === 0,
        })),
      });

      if (dto.variants && dto.variants.length > 0) {
        await tx.productVariant.createMany({
          data: dto.variants.map((v) => ({
            productId: created.id,
            sku: v.sku,
            name: v.name,
            price: new Prisma.Decimal(v.price),
            stock: v.stock,
            lowStockAt: v.lowStockAt ?? 5,
            weight: v.weight ? new Prisma.Decimal(v.weight) : undefined,
            attributes: JSON.stringify(v.attributes),
          })),
        });
      }

      if (dto.bulkPricing && dto.bulkPricing.length > 0) {
        await tx.bulkPricingTier.createMany({
          data: dto.bulkPricing.map((tier) => ({
            productId: created.id,
            minQty: tier.minQty,
            maxQty: tier.maxQty,
            price: new Prisma.Decimal(tier.price),
          })),
        });
      }

      return tx.product.findUniqueOrThrow({
        where: { id: created.id },
        include: PRODUCT_FULL_INCLUDE,
      });
    });

    this.logger.log(
      `Product created: ${product.name} (${product.id}) by vendor ${vendorId}`,
    );
    return ProductResponseDto.fromEntity(product);
  }

  async findById(id: string, requesterId?: string, requesterRole?: UserRole): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: PRODUCT_FULL_INCLUDE,
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    if (
      requesterRole === UserRole.VENDOR &&
      product.vendorId !== requesterId
    ) {
      throw new ForbiddenException('You can only view your own products');
    }

    return ProductResponseDto.fromEntity(product);
  }

  async findBySlug(slug: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: PRODUCT_FULL_INCLUDE,
    });

    if (!product || product.deletedAt !== null || product.status !== ProductStatus.ACTIVE) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    await this.prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    return ProductResponseDto.fromEntity(product);
  }

  async listProducts(
    query: QueryProductsDto,
    callerRole?: UserRole,
    callerVendorId?: string,
  ): Promise<PaginatedResponse<ProductListItemDto>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
    };

    if (callerRole === UserRole.ADMIN || callerRole === UserRole.SUPER_ADMIN) {
      if (query.status) {
        where.status = query.status;
      }
    } else if (callerRole === UserRole.VENDOR && callerVendorId) {
      where.vendorId = callerVendorId;
      if (query.status) {
        where.status = query.status;
      }
    } else {
      where.status = ProductStatus.ACTIVE;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.vendorId) {
      where.vendorId = query.vendorId;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.basePrice = {};
      if (query.minPrice !== undefined) {
        where.basePrice.gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        where.basePrice.lte = query.maxPrice;
      }
    }

    if (query.currency) {
      where.baseCurrency = query.currency;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.country) {
      where.vendor = {
        vendorProfile: {
          country: query.country,
        },
      };
    }

    const orderBy = this.buildSortOrder(query.sortBy);

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_LIST_INCLUDE,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: products.map((p) => ProductListItemDto.fromEntity(p)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async update(
    vendorId: string,
    productId: string,
    dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    if (product.vendorId !== vendorId) {
      throw new ForbiddenException('You can only update your own products');
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category || !category.isActive) {
        throw new NotFoundException(
          `Category with ID "${dto.categoryId}" not found or is inactive`,
        );
      }
    }

    const shouldRegenerateSlug =
      dto.name && dto.name !== product.name;
    const slug = shouldRegenerateSlug ? generateSlug(dto.name!) : undefined;

    const statusUpdate =
      product.status === ProductStatus.REJECTED
        ? ProductStatus.DRAFT
        : undefined;

    let updatedProduct;
    try {
      updatedProduct = await this.prisma.product.update({
        where: { id: productId },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(slug && { slug }),
          ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.shortDesc !== undefined && { shortDesc: dto.shortDesc }),
          ...(dto.baseCurrency !== undefined && { baseCurrency: dto.baseCurrency }),
          ...(dto.basePrice !== undefined && {
            basePrice: new Prisma.Decimal(dto.basePrice),
          }),
          ...(dto.comparePrice !== undefined && {
            comparePrice: dto.comparePrice
              ? new Prisma.Decimal(dto.comparePrice)
              : null,
          }),
          ...(dto.moq !== undefined && { moq: dto.moq }),
          ...(dto.maxQty !== undefined && { maxQty: dto.maxQty }),
          ...(dto.unit !== undefined && { unit: dto.unit }),
          ...(dto.weight !== undefined && {
            weight: dto.weight ? new Prisma.Decimal(dto.weight) : null,
          }),
          ...(dto.length !== undefined && {
            length: dto.length ? new Prisma.Decimal(dto.length) : null,
          }),
          ...(dto.width !== undefined && {
            width: dto.width ? new Prisma.Decimal(dto.width) : null,
          }),
          ...(dto.height !== undefined && {
            height: dto.height ? new Prisma.Decimal(dto.height) : null,
          }),
          ...(dto.hsCode !== undefined && { hsCode: dto.hsCode }),
          ...(dto.originCountry !== undefined && { originCountry: dto.originCountry }),
          ...(dto.tags !== undefined && {
            tags: dto.tags ? JSON.stringify(dto.tags) : null,
          }),
          ...(statusUpdate && { status: statusUpdate }),
        },
        include: PRODUCT_FULL_INCLUDE,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `A product with slug "${slug}" already exists`,
        );
      }
      throw error;
    }

    this.logger.log(`Product updated: ${updatedProduct.name} (${productId})`);
    return ProductResponseDto.fromEntity(updatedProduct);
  }

  async updateStatus(
    productId: string,
    status: ProductStatus,
    adminNote?: string,
  ): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    const allowedStatuses: ProductStatus[] = [
      ProductStatus.ACTIVE,
      ProductStatus.REJECTED,
      ProductStatus.PAUSED,
    ];

    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException(
        `Status can only be set to: ${allowedStatuses.join(', ')}`,
      );
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: { status },
      include: PRODUCT_FULL_INCLUDE,
    });

    this.logger.log(
      `Product status updated: ${productId} -> ${status}${adminNote ? ` (note: ${adminNote})` : ''}`,
    );
    return ProductResponseDto.fromEntity(updatedProduct);
  }

  async delete(
    vendorId: string,
    productId: string,
  ): Promise<{ message: string }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    if (product.vendorId !== vendorId) {
      throw new ForbiddenException('You can only delete your own products');
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date() },
    });

    this.logger.warn(`Product soft-deleted: ${product.name} (${productId})`);
    return { message: `Product "${product.name}" has been deleted` };
  }

  async manageImages(
    vendorId: string,
    productId: string,
    dto: ManageImagesDto,
  ): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, deletedAt: null },
      include: { images: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    if (product.vendorId !== vendorId) {
      throw new ForbiddenException('You can only manage images for your own products');
    }

    await this.prisma.$transaction(async (tx) => {
      if (dto.removeImageIds && dto.removeImageIds.length > 0) {
        await tx.productImage.deleteMany({
          where: {
            id: { in: dto.removeImageIds },
            productId,
          },
        });
      }

      if (dto.addImages && dto.addImages.length > 0) {
        const maxSortOrder = product.images.reduce(
          (max, img) => Math.max(max, img.sortOrder),
          -1,
        );
        await tx.productImage.createMany({
          data: dto.addImages.map((img, index) => ({
            productId,
            url: img.url,
            altText: img.altText,
            sortOrder: img.sortOrder ?? maxSortOrder + 1 + index,
            isPrimary: false,
          })),
        });
      }

      if (dto.setPrimaryImageId) {
        await tx.productImage.updateMany({
          where: { productId, isPrimary: true },
          data: { isPrimary: false },
        });

        const imageExists = await tx.productImage.findFirst({
          where: { id: dto.setPrimaryImageId, productId },
        });

        if (!imageExists) {
          throw new NotFoundException(
            `Image with ID "${dto.setPrimaryImageId}" not found for this product`,
          );
        }

        await tx.productImage.update({
          where: { id: dto.setPrimaryImageId },
          data: { isPrimary: true },
        });
      }
    });

    const updatedProduct = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: PRODUCT_FULL_INCLUDE,
    });

    this.logger.log(`Product images managed: ${productId}`);
    return ProductResponseDto.fromEntity(updatedProduct);
  }

  async manageVariants(
    vendorId: string,
    productId: string,
    dto: ManageVariantsDto,
  ): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found`);
    }

    if (product.vendorId !== vendorId) {
      throw new ForbiddenException('You can only manage variants for your own products');
    }

    await this.prisma.$transaction(async (tx) => {
      if (dto.removeVariantIds && dto.removeVariantIds.length > 0) {
        await tx.productVariant.deleteMany({
          where: {
            id: { in: dto.removeVariantIds },
            productId,
          },
        });
      }

      if (dto.addVariants && dto.addVariants.length > 0) {
        try {
          await tx.productVariant.createMany({
            data: dto.addVariants.map((v) => ({
              productId,
              sku: v.sku,
              name: v.name,
              price: new Prisma.Decimal(v.price),
              stock: v.stock,
              lowStockAt: v.lowStockAt ?? 5,
              weight: v.weight ? new Prisma.Decimal(v.weight) : undefined,
              attributes: JSON.stringify(v.attributes),
            })),
          });
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            throw new ConflictException('One or more variant SKUs already exist');
          }
          throw error;
        }
      }

      if (dto.updateVariants && dto.updateVariants.length > 0) {
        for (const variant of dto.updateVariants) {
          const existing = await tx.productVariant.findFirst({
            where: { id: variant.id, productId },
          });

          if (!existing) {
            throw new NotFoundException(
              `Variant with ID "${variant.id}" not found for this product`,
            );
          }

          try {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                ...(variant.sku !== undefined && { sku: variant.sku }),
                ...(variant.name !== undefined && { name: variant.name }),
                ...(variant.price !== undefined && {
                  price: new Prisma.Decimal(variant.price),
                }),
                ...(variant.stock !== undefined && { stock: variant.stock }),
                ...(variant.lowStockAt !== undefined && { lowStockAt: variant.lowStockAt }),
                ...(variant.weight !== undefined && {
                  weight: variant.weight
                    ? new Prisma.Decimal(variant.weight)
                    : null,
                }),
                ...(variant.attributes !== undefined && {
                  attributes: JSON.stringify(variant.attributes),
                }),
              },
            });
          } catch (error) {
            if (
              error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === 'P2002'
            ) {
              throw new ConflictException(
                `Variant SKU "${variant.sku}" already exists`,
              );
            }
            throw error;
          }
        }
      }
    });

    const updatedProduct = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      include: PRODUCT_FULL_INCLUDE,
    });

    this.logger.log(`Product variants managed: ${productId}`);
    return ProductResponseDto.fromEntity(updatedProduct);
  }

  async getVendorProducts(
    vendorId: string,
    query: QueryProductsDto,
  ): Promise<PaginatedResponse<ProductListItemDto>> {
    return this.listProducts(query, UserRole.VENDOR, vendorId);
  }

  async getPendingProducts(
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<ProductListItemDto>> {
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.PENDING_REVIEW,
      deletedAt: null,
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_LIST_INCLUDE,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: products.map((p) => ProductListItemDto.fromEntity(p)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  private validateBulkPricing(
    tiers: { minQty: number; maxQty?: number; price: string }[],
  ): void {
    const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);

    for (let i = 0; i < sorted.length; i++) {
      const currentTier = sorted[i]!;

      if (currentTier.maxQty !== undefined && currentTier.maxQty < currentTier.minQty) {
        throw new BadRequestException(
          `Bulk pricing tier ${i + 1}: maxQty must be >= minQty`,
        );
      }

      if (i > 0) {
        const prevTier = sorted[i - 1]!;
        if (prevTier.maxQty === undefined) {
          throw new BadRequestException(
            'Only the last bulk pricing tier can have an undefined maxQty',
          );
        }
        if (currentTier.minQty <= prevTier.maxQty) {
          throw new BadRequestException(
            `Bulk pricing tier ${i + 1}: minQty (${currentTier.minQty}) overlaps with previous tier maxQty (${prevTier.maxQty})`,
          );
        }
      }
    }
  }

  private buildSortOrder(
    sortBy?: ProductSortBy,
  ): Prisma.ProductOrderByWithRelationInput[] {
    switch (sortBy) {
      case ProductSortBy.PRICE_ASC:
        return [{ basePrice: 'asc' }];
      case ProductSortBy.PRICE_DESC:
        return [{ basePrice: 'desc' }];
      case ProductSortBy.NEWEST:
        return [{ createdAt: 'desc' }];
      case ProductSortBy.RATING:
        return [{ averageRating: 'desc' }, { totalReviews: 'desc' }];
      case ProductSortBy.POPULAR:
        return [{ totalSold: 'desc' }, { viewCount: 'desc' }];
      default:
        return [{ createdAt: 'desc' }];
    }
  }
}
