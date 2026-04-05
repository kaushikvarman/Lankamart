import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Coupon } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

function decToNum(value: Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Decimal) return value.toNumber();
  return Number(value);
}

function decToNumReq(value: Decimal | number): number {
  if (value instanceof Decimal) return value.toNumber();
  return Number(value);
}

export class CouponResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiPropertyOptional() description!: string | null;
  @ApiProperty() type!: string;
  @ApiProperty() value!: number;
  @ApiPropertyOptional() currency!: string | null;
  @ApiPropertyOptional() minOrderValue!: number | null;
  @ApiPropertyOptional() maxDiscount!: number | null;
  @ApiPropertyOptional() usageLimit!: number | null;
  @ApiProperty() usageCount!: number;
  @ApiProperty() perUserLimit!: number;
  @ApiPropertyOptional() vendorId!: string | null;
  @ApiPropertyOptional() categoryId!: string | null;
  @ApiProperty() startsAt!: Date;
  @ApiProperty() expiresAt!: Date;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  static fromEntity(coupon: Coupon): CouponResponseDto {
    const dto = new CouponResponseDto();
    dto.id = coupon.id;
    dto.code = coupon.code;
    dto.description = coupon.description;
    dto.type = coupon.type;
    dto.value = decToNumReq(coupon.value);
    dto.currency = coupon.currency;
    dto.minOrderValue = decToNum(coupon.minOrderValue);
    dto.maxDiscount = decToNum(coupon.maxDiscount);
    dto.usageLimit = coupon.usageLimit;
    dto.usageCount = coupon.usageCount;
    dto.perUserLimit = coupon.perUserLimit;
    dto.vendorId = coupon.vendorId;
    dto.categoryId = coupon.categoryId;
    dto.startsAt = coupon.startsAt;
    dto.expiresAt = coupon.expiresAt;
    dto.isActive = coupon.isActive;
    dto.createdAt = coupon.createdAt;
    dto.updatedAt = coupon.updatedAt;
    return dto;
  }
}
