import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class AddImageDto {
  @ApiPropertyOptional({ description: 'Image URL' })
  @IsString()
  @MaxLength(500)
  url!: string;

  @ApiPropertyOptional({ description: 'Alt text' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ManageImagesDto {
  @ApiPropertyOptional({ description: 'Images to add', type: [AddImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddImageDto)
  addImages?: AddImageDto[];

  @ApiPropertyOptional({ description: 'Image IDs to remove' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  removeImageIds?: string[];

  @ApiPropertyOptional({ description: 'Set primary image by ID' })
  @IsOptional()
  @IsUUID()
  setPrimaryImageId?: string;
}
