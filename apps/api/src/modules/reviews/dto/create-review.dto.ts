import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateReviewDto {
  @ApiPropertyOptional({ description: 'Product ID (UUID) — required if no targetUserId' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'Vendor user ID (UUID) — required if no productId' })
  @IsOptional()
  @IsUUID()
  targetUserId?: string;

  @ApiPropertyOptional({ description: 'Order item ID to verify purchase' })
  @IsOptional()
  @IsUUID()
  orderItemId?: string;

  @ApiProperty({ description: 'Rating from 1 to 5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ description: 'Review title (max 200 chars)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Review content (max 2000 chars)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @ApiPropertyOptional({
    description: 'Image URLs (max 5)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUrl({}, { each: true })
  images?: string[];

  /**
   * Custom cross-field validation is enforced at the service layer:
   * at least one of productId or targetUserId must be provided.
   */
  @ValidateIf((o: CreateReviewDto) => !o.productId && !o.targetUserId)
  @IsUUID(undefined, {
    message: 'At least one of productId or targetUserId must be provided',
  })
  private readonly _crossFieldGuard?: string;
}
