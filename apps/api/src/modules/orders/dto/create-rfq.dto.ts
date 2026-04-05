import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateRfqDto {
  @ApiProperty({ description: 'RFQ title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Detailed description of the request' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({ description: 'Product ID for specific product inquiries' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ description: 'Required quantity', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ description: 'Unit of measurement', example: 'kg' })
  @IsString()
  @IsNotEmpty()
  unit!: string;

  @ApiPropertyOptional({ description: 'Target price per unit' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  targetPrice?: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Delivery address as JSON string' })
  @IsString()
  @IsNotEmpty()
  deliveryAddress!: string;

  @ApiPropertyOptional({ description: 'Required delivery date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  requiredBy?: string;

  @ApiPropertyOptional({
    description: 'Attachment URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiProperty({ description: 'RFQ expiration date (ISO 8601)' })
  @IsDateString()
  expiresAt!: string;
}
