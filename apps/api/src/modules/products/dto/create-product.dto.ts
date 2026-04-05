import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDecimal,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
  IsBoolean,
  IsObject,
  Matches,
  MinLength,
} from 'class-validator';

export class ProductImageDto {
  @ApiProperty({ description: 'Image URL' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  url!: string;

  @ApiPropertyOptional({ description: 'Alt text for accessibility' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;

  @ApiPropertyOptional({ description: 'Whether this is the primary image', default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class ProductVariantDto {
  @ApiProperty({ description: 'SKU (unique)', example: 'SKU-001-RED-L' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  sku!: string;

  @ApiProperty({ description: 'Variant name', example: 'Red / Large' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'Variant price', example: '29.99' })
  @IsNotEmpty()
  @IsDecimal({ decimal_digits: '0,2' })
  price!: string;

  @ApiProperty({ description: 'Stock quantity', example: 100 })
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional({ description: 'Low stock alert threshold', default: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockAt?: number;

  @ApiPropertyOptional({ description: 'Variant weight in kg', example: '0.5' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,3' })
  weight?: string;

  @ApiProperty({
    description: 'Variant attributes as key-value pairs',
    example: { color: 'red', size: 'L' },
  })
  @IsObject()
  attributes!: Record<string, string>;
}

export class BulkPricingTierDto {
  @ApiProperty({ description: 'Minimum quantity for this tier', example: 10 })
  @IsInt()
  @IsPositive()
  minQty!: number;

  @ApiPropertyOptional({ description: 'Maximum quantity for this tier', example: 49 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  maxQty?: number;

  @ApiProperty({ description: 'Price per unit at this tier', example: '24.99' })
  @IsNotEmpty()
  @IsDecimal({ decimal_digits: '0,2' })
  price!: string;
}

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'Premium Ceylon Cinnamon Sticks' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'Category ID' })
  @IsNotEmpty()
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ description: 'Product description' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({ description: 'Short description', example: 'Grade A cinnamon' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDesc?: string;

  @ApiPropertyOptional({ description: 'Base currency (ISO 4217)', example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  baseCurrency?: string;

  @ApiProperty({ description: 'Base price', example: '29.99' })
  @IsNotEmpty()
  @IsDecimal({ decimal_digits: '0,2' })
  basePrice!: string;

  @ApiPropertyOptional({ description: 'Compare at price (original/MSRP)', example: '39.99' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  comparePrice?: string;

  @ApiPropertyOptional({ description: 'Minimum order quantity', example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  moq?: number;

  @ApiPropertyOptional({ description: 'Maximum order quantity per order', example: 1000 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  maxQty?: number;

  @ApiPropertyOptional({ description: 'Unit of measurement', example: 'piece', default: 'piece' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @ApiPropertyOptional({ description: 'Weight in kg', example: '0.500' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,3' })
  weight?: string;

  @ApiPropertyOptional({ description: 'Length in cm', example: '10.00' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  length?: string;

  @ApiPropertyOptional({ description: 'Width in cm', example: '5.00' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  width?: string;

  @ApiPropertyOptional({ description: 'Height in cm', example: '3.00' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  height?: string;

  @ApiPropertyOptional({ description: 'HS code for customs', example: '0906.11' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsCode?: string;

  @ApiPropertyOptional({
    description: 'Country of origin (ISO 3166-1 alpha-2)',
    example: 'LK',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'originCountry must be a 2-character ISO country code' })
  originCountry?: string;

  @ApiPropertyOptional({ description: 'Product tags', example: ['organic', 'premium'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Product images', type: [ProductImageDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images!: ProductImageDto[];

  @ApiPropertyOptional({ description: 'Product variants', type: [ProductVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @ApiPropertyOptional({ description: 'Bulk pricing tiers', type: [BulkPricingTierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkPricingTierDto)
  bulkPricing?: BulkPricingTierDto[];
}
