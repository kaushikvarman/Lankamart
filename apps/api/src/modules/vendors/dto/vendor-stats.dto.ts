import { ApiProperty } from '@nestjs/swagger';

export class VendorStatsDto {
  @ApiProperty({ description: 'Total number of products', example: 42 })
  totalProducts!: number;

  @ApiProperty({ description: 'Total number of orders received', example: 150 })
  totalOrders!: number;

  @ApiProperty({ description: 'Total revenue earned', example: 25000.5 })
  totalRevenue!: number;

  @ApiProperty({ description: 'Number of pending orders', example: 5 })
  pendingOrders!: number;

  @ApiProperty({ description: 'Average rating (0-5)', example: 4.3 })
  averageRating!: number;

  @ApiProperty({ description: 'Total number of reviews received', example: 87 })
  totalReviews!: number;

  @ApiProperty({ description: 'Profile completeness percentage (0-100)', example: 75 })
  profileCompleteness!: number;

  static create(data: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    averageRating: number;
    totalReviews: number;
    profileCompleteness: number;
  }): VendorStatsDto {
    const dto = new VendorStatsDto();
    dto.totalProducts = data.totalProducts;
    dto.totalOrders = data.totalOrders;
    dto.totalRevenue = data.totalRevenue;
    dto.pendingOrders = data.pendingOrders;
    dto.averageRating = data.averageRating;
    dto.totalReviews = data.totalReviews;
    dto.profileCompleteness = data.profileCompleteness;
    return dto;
  }
}
