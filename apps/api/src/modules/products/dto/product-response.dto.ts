import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Product,
  ProductImage,
  ProductVariant,
  BulkPricingTier,
  Category,
  VendorProfile,
  ProductStatus,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

function toNumber(value: Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Decimal) return value.toNumber();
  return Number(value);
}

function toNumberRequired(value: Decimal | number): number {
  if (value instanceof Decimal) return value.toNumber();
  return Number(value);
}

export class ProductImageResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() url!: string;
  @ApiPropertyOptional() altText!: string | null;
  @ApiProperty() sortOrder!: number;
  @ApiProperty() isPrimary!: boolean;

  static fromEntity(image: ProductImage): ProductImageResponseDto {
    const dto = new ProductImageResponseDto();
    dto.id = image.id;
    dto.url = image.url;
    dto.altText = image.altText;
    dto.sortOrder = image.sortOrder;
    dto.isPrimary = image.isPrimary;
    return dto;
  }
}

export class ProductVariantResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() sku!: string;
  @ApiProperty() name!: string;
  @ApiProperty() price!: number;
  @ApiProperty() stock!: number;
  @ApiProperty() lowStockAt!: number;
  @ApiPropertyOptional() weight!: number | null;
  @ApiPropertyOptional() imageUrl!: string | null;
  @ApiProperty() attributes!: Record<string, string>;
  @ApiProperty() isActive!: boolean;

  static fromEntity(variant: ProductVariant): ProductVariantResponseDto {
    const dto = new ProductVariantResponseDto();
    dto.id = variant.id;
    dto.sku = variant.sku;
    dto.name = variant.name;
    dto.price = toNumberRequired(variant.price);
    dto.stock = variant.stock;
    dto.lowStockAt = variant.lowStockAt;
    dto.weight = toNumber(variant.weight);
    dto.imageUrl = variant.imageUrl;
    dto.attributes = JSON.parse(variant.attributes) as Record<string, string>;
    dto.isActive = variant.isActive;
    return dto;
  }
}

export class BulkPricingTierResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() minQty!: number;
  @ApiPropertyOptional() maxQty!: number | null;
  @ApiProperty() price!: number;

  static fromEntity(tier: BulkPricingTier): BulkPricingTierResponseDto {
    const dto = new BulkPricingTierResponseDto();
    dto.id = tier.id;
    dto.minQty = tier.minQty;
    dto.maxQty = tier.maxQty;
    dto.price = toNumberRequired(tier.price);
    return dto;
  }
}

export class ProductCategoryInfoDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
}

export class ProductVendorInfoDto {
  @ApiProperty() id!: string;
  @ApiProperty() businessName!: string;
  @ApiProperty() businessSlug!: string;
  @ApiProperty() isVerified!: boolean;
}

type ProductWithRelations = Product & {
  images?: ProductImage[];
  variants?: ProductVariant[];
  bulkPricingTiers?: BulkPricingTier[];
  category?: Category;
  vendor?: {
    vendorProfile?: VendorProfile | null;
  };
};

export class ProductResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() description!: string;
  @ApiPropertyOptional() shortDesc!: string | null;
  @ApiProperty({ enum: ProductStatus }) status!: ProductStatus;
  @ApiProperty() baseCurrency!: string;
  @ApiProperty() basePrice!: number;
  @ApiPropertyOptional() comparePrice!: number | null;
  @ApiProperty() moq!: number;
  @ApiPropertyOptional() maxQty!: number | null;
  @ApiProperty() unit!: string;
  @ApiPropertyOptional() weight!: number | null;
  @ApiPropertyOptional() length!: number | null;
  @ApiPropertyOptional() width!: number | null;
  @ApiPropertyOptional() height!: number | null;
  @ApiPropertyOptional() hsCode!: string | null;
  @ApiPropertyOptional() originCountry!: string | null;
  @ApiPropertyOptional() tags!: string[] | null;
  @ApiProperty() isFeatured!: boolean;
  @ApiProperty() averageRating!: number;
  @ApiProperty() totalReviews!: number;
  @ApiProperty() totalSold!: number;
  @ApiProperty() viewCount!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  @ApiPropertyOptional({ type: [ProductImageResponseDto] })
  images?: ProductImageResponseDto[];

  @ApiPropertyOptional({ type: [ProductVariantResponseDto] })
  variants?: ProductVariantResponseDto[];

  @ApiPropertyOptional({ type: [BulkPricingTierResponseDto] })
  bulkPricing?: BulkPricingTierResponseDto[];

  @ApiPropertyOptional({ type: ProductCategoryInfoDto })
  category?: ProductCategoryInfoDto;

  @ApiPropertyOptional({ type: ProductVendorInfoDto })
  vendor?: ProductVendorInfoDto;

  static fromEntity(product: ProductWithRelations): ProductResponseDto {
    const dto = new ProductResponseDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.slug = product.slug;
    dto.description = product.description;
    dto.shortDesc = product.shortDesc;
    dto.status = product.status;
    dto.baseCurrency = product.baseCurrency;
    dto.basePrice = toNumberRequired(product.basePrice);
    dto.comparePrice = toNumber(product.comparePrice);
    dto.moq = product.moq;
    dto.maxQty = product.maxQty;
    dto.unit = product.unit;
    dto.weight = toNumber(product.weight);
    dto.length = toNumber(product.length);
    dto.width = toNumber(product.width);
    dto.height = toNumber(product.height);
    dto.hsCode = product.hsCode;
    dto.originCountry = product.originCountry;
    dto.tags = product.tags ? (JSON.parse(product.tags) as string[]) : null;
    dto.isFeatured = product.isFeatured;
    dto.averageRating = toNumberRequired(product.averageRating);
    dto.totalReviews = product.totalReviews;
    dto.totalSold = product.totalSold;
    dto.viewCount = product.viewCount;
    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;

    if (product.images) {
      dto.images = product.images.map((img) =>
        ProductImageResponseDto.fromEntity(img),
      );
    }

    if (product.variants) {
      dto.variants = product.variants.map((v) =>
        ProductVariantResponseDto.fromEntity(v),
      );
    }

    if (product.bulkPricingTiers) {
      dto.bulkPricing = product.bulkPricingTiers.map((t) =>
        BulkPricingTierResponseDto.fromEntity(t),
      );
    }

    if (product.category) {
      dto.category = {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      };
    }

    if (product.vendor?.vendorProfile) {
      dto.vendor = {
        id: product.vendor.vendorProfile.id,
        businessName: product.vendor.vendorProfile.businessName,
        businessSlug: product.vendor.vendorProfile.businessSlug,
        isVerified: product.vendor.vendorProfile.isVerified,
      };
    }

    return dto;
  }
}
