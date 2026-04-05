import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product, ProductImage } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

type ProductListEntity = Product & {
  images?: ProductImage[];
  category?: { name: string } | null;
  vendor?: {
    vendorProfile?: {
      businessName: string;
      businessSlug: string;
      isVerified: boolean;
    } | null;
  };
};

function toNumber(value: Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Decimal) return value.toNumber();
  return Number(value);
}

function toNumberRequired(value: Decimal | number): number {
  if (value instanceof Decimal) return value.toNumber();
  return Number(value);
}

export class ProductListItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() basePrice!: number;
  @ApiPropertyOptional() comparePrice!: number | null;
  @ApiProperty() currency!: string;
  @ApiPropertyOptional() primaryImageUrl!: string | null;
  @ApiProperty() averageRating!: number;
  @ApiProperty() totalReviews!: number;
  @ApiProperty() moq!: number;
  @ApiPropertyOptional() vendorName!: string | null;
  @ApiPropertyOptional() vendorSlug!: string | null;
  @ApiProperty() vendorVerified!: boolean;
  @ApiPropertyOptional() categoryName!: string | null;

  static fromEntity(product: ProductListEntity): ProductListItemDto {
    const dto = new ProductListItemDto();
    dto.id = product.id;
    dto.name = product.name;
    dto.slug = product.slug;
    dto.basePrice = toNumberRequired(product.basePrice);
    dto.comparePrice = toNumber(product.comparePrice);
    dto.currency = product.baseCurrency;

    const primaryImage = product.images?.find((img) => img.isPrimary);
    dto.primaryImageUrl = primaryImage?.url ?? product.images?.[0]?.url ?? null;

    dto.averageRating = toNumberRequired(product.averageRating);
    dto.totalReviews = product.totalReviews;
    dto.moq = product.moq;

    dto.vendorName = product.vendor?.vendorProfile?.businessName ?? null;
    dto.vendorSlug = product.vendor?.vendorProfile?.businessSlug ?? null;
    dto.vendorVerified = product.vendor?.vendorProfile?.isVerified ?? false;
    dto.categoryName = product.category?.name ?? null;

    return dto;
  }
}
