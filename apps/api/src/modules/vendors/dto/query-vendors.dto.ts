import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { KycStatus, VendorTier } from '@prisma/client';
import { Transform } from 'class-transformer';

export class QueryVendorsDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by country (LK or IN)',
    example: 'LK',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Filter by vendor tier',
    enum: VendorTier,
    example: VendorTier.FREE,
  })
  @IsOptional()
  @IsEnum(VendorTier)
  tier?: VendorTier;

  @ApiPropertyOptional({
    description: 'Filter by KYC status',
    enum: KycStatus,
    example: KycStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(KycStatus)
  kycStatus?: KycStatus;

  @ApiPropertyOptional({
    description: 'Filter by verification status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Search by business name',
    example: 'spices',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
