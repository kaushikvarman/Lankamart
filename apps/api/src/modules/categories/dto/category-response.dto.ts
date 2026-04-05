import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

interface CategoryWithCounts extends Category {
  _count?: {
    children?: number;
    products?: number;
  };
  children?: CategoryWithCounts[];
}

export class CategoryResponseDto {
  @ApiProperty({ description: 'Category ID' })
  id!: string;

  @ApiProperty({ description: 'Category name', example: 'Electronics' })
  name!: string;

  @ApiProperty({ description: 'URL slug', example: 'electronics-a3f1b2' })
  slug!: string;

  @ApiPropertyOptional({ description: 'Category description' })
  description!: string | null;

  @ApiPropertyOptional({ description: 'Category image URL' })
  imageUrl!: string | null;

  @ApiPropertyOptional({ description: 'Parent category ID' })
  parentId!: string | null;

  @ApiProperty({ description: 'Sort order', example: 0 })
  sortOrder!: number;

  @ApiProperty({ description: 'Whether the category is active', example: true })
  isActive!: boolean;

  @ApiPropertyOptional({ description: 'Commission rate override (%)', example: 7.5 })
  commission!: number | null;

  @ApiPropertyOptional({ description: 'Default HS code', example: '0904.11' })
  hsCode!: string | null;

  @ApiPropertyOptional({ description: 'GST rate (%)', example: 18 })
  gstRate!: number | null;

  @ApiProperty({ description: 'Number of child categories', example: 5 })
  childCount!: number;

  @ApiProperty({ description: 'Number of products in this category', example: 42 })
  productCount!: number;

  @ApiProperty({ description: 'Category creation date' })
  createdAt!: Date;

  @ApiPropertyOptional({
    description: 'Nested children (only in tree view)',
    type: [CategoryResponseDto],
  })
  children?: CategoryResponseDto[];

  static fromEntity(category: CategoryWithCounts): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.id = category.id;
    dto.name = category.name;
    dto.slug = category.slug;
    dto.description = category.description;
    dto.imageUrl = category.imageUrl;
    dto.parentId = category.parentId;
    dto.sortOrder = category.sortOrder;
    dto.isActive = category.isActive;
    dto.commission = category.commission instanceof Decimal
      ? category.commission.toNumber()
      : category.commission !== null && category.commission !== undefined
        ? Number(category.commission)
        : null;
    dto.hsCode = category.hsCode;
    dto.gstRate = category.gstRate instanceof Decimal
      ? category.gstRate.toNumber()
      : category.gstRate !== null && category.gstRate !== undefined
        ? Number(category.gstRate)
        : null;
    dto.childCount = category._count?.children ?? 0;
    dto.productCount = category._count?.products ?? 0;
    dto.createdAt = category.createdAt;

    if (category.children) {
      dto.children = category.children.map((child) =>
        CategoryResponseDto.fromEntity(child),
      );
    }

    return dto;
  }
}
