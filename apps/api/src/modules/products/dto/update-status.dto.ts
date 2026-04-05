import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class UpdateProductStatusDto {
  @ApiProperty({
    description: 'New product status',
    enum: [ProductStatus.ACTIVE, ProductStatus.REJECTED, ProductStatus.PAUSED],
  })
  @IsNotEmpty()
  @IsEnum([ProductStatus.ACTIVE, ProductStatus.REJECTED, ProductStatus.PAUSED])
  status!: ProductStatus;

  @ApiPropertyOptional({ description: 'Admin note (reason for rejection, etc.)' })
  @IsOptional()
  @IsString()
  adminNote?: string;
}
