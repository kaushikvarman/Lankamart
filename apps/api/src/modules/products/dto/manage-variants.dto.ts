import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDecimal,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class AddVariantDto {
  @ApiProperty({ description: 'SKU (unique)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  sku!: string;

  @ApiProperty({ description: 'Variant name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'Variant price' })
  @IsNotEmpty()
  @IsDecimal({ decimal_digits: '0,2' })
  price!: string;

  @ApiProperty({ description: 'Stock quantity' })
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional({ description: 'Low stock alert threshold' })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockAt?: number;

  @ApiPropertyOptional({ description: 'Variant weight in kg' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,3' })
  weight?: string;

  @ApiProperty({ description: 'Variant attributes' })
  @IsObject()
  attributes!: Record<string, string>;
}

export class UpdateVariantDto {
  @ApiProperty({ description: 'Variant ID to update' })
  @IsNotEmpty()
  @IsUUID()
  id!: string;

  @ApiPropertyOptional({ description: 'SKU' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({ description: 'Variant name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Variant price' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  price?: string;

  @ApiPropertyOptional({ description: 'Stock quantity' })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ description: 'Low stock alert threshold' })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockAt?: number;

  @ApiPropertyOptional({ description: 'Variant weight in kg' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,3' })
  weight?: string;

  @ApiPropertyOptional({ description: 'Variant attributes' })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;
}

export class ManageVariantsDto {
  @ApiPropertyOptional({ description: 'Variants to add', type: [AddVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddVariantDto)
  addVariants?: AddVariantDto[];

  @ApiPropertyOptional({ description: 'Variants to update', type: [UpdateVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantDto)
  updateVariants?: UpdateVariantDto[];

  @ApiPropertyOptional({ description: 'Variant IDs to remove' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  removeVariantIds?: string[];
}
