import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping',
}

@ValidatorConstraint({ name: 'expiresAfterStarts', async: false })
class ExpiresAfterStartsConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as CreateCouponDto;
    if (!obj.startsAt || !obj.expiresAt) return true;
    return new Date(obj.expiresAt) > new Date(obj.startsAt);
  }

  defaultMessage(): string {
    return 'expiresAt must be after startsAt';
  }
}

@ValidatorConstraint({ name: 'currencyRequiredForFixed', async: false })
class CurrencyRequiredForFixedConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as CreateCouponDto;
    if (obj.type === CouponType.FIXED_AMOUNT && !obj.currency) {
      return false;
    }
    return true;
  }

  defaultMessage(): string {
    return 'currency is required when type is fixed_amount';
  }
}

export class CreateCouponDto {
  @ApiProperty({ description: 'Coupon code', example: 'SUMMER20' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  code!: string;

  @ApiPropertyOptional({ description: 'Coupon description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Discount type', enum: CouponType })
  @IsEnum(CouponType)
  @Validate(CurrencyRequiredForFixedConstraint)
  type!: CouponType;

  @ApiProperty({ description: 'Discount value', example: 20 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value!: number;

  @ApiPropertyOptional({ description: 'Currency (required for fixed_amount)', example: 'USD' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Minimum order value', example: 50 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional({ description: 'Maximum discount cap for percentage type', example: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxDiscount?: number;

  @ApiPropertyOptional({ description: 'Total usage limit' })
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @ApiProperty({ description: 'Per-user usage limit', default: 1 })
  @IsInt()
  @Min(1)
  perUserLimit: number = 1;

  @ApiPropertyOptional({ description: 'Vendor ID (null = platform-wide)' })
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiPropertyOptional({ description: 'Category ID restriction' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ description: 'Start date', example: '2026-04-01T00:00:00Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ description: 'Expiry date', example: '2026-05-01T00:00:00Z' })
  @IsDateString()
  @Validate(ExpiresAfterStartsConstraint)
  expiresAt!: string;
}
