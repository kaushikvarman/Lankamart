import { ApiProperty } from '@nestjs/swagger';

export class RecentOrderDto {
  @ApiProperty() id!: string;
  @ApiProperty() orderNumber!: string;
  @ApiProperty() buyerName!: string;
  @ApiProperty() totalAmount!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() status!: string;
  @ApiProperty() createdAt!: Date;
}

export class TopProductDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() totalSold!: number;
  @ApiProperty() basePrice!: number;
  @ApiProperty() baseCurrency!: string;
}

export class DashboardStatsDto {
  @ApiProperty() totalUsers!: number;
  @ApiProperty() totalVendors!: number;
  @ApiProperty() totalBuyers!: number;
  @ApiProperty() totalProducts!: number;
  @ApiProperty() totalOrders!: number;
  @ApiProperty() totalRevenue!: number;
  @ApiProperty() pendingOrders!: number;
  @ApiProperty() pendingKyc!: number;
  @ApiProperty() pendingProductReviews!: number;
  @ApiProperty() activeDisputes!: number;
  @ApiProperty({ type: [RecentOrderDto] }) recentOrders!: RecentOrderDto[];
  @ApiProperty({ type: [TopProductDto] }) topProducts!: TopProductDto[];
}
