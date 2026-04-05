import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingMode } from '@prisma/client';

export class ShippingQuoteResponseDto {
  @ApiProperty({ description: 'Partner ID' })
  partnerId!: string;

  @ApiProperty({ description: 'Partner company name', example: 'Ceylon Freight Express' })
  partnerName!: string;

  @ApiPropertyOptional({ description: 'Partner logo URL' })
  partnerLogo!: string | null;

  @ApiProperty({ description: 'Shipping mode', enum: ShippingMode })
  shippingMode!: ShippingMode;

  @ApiProperty({ description: 'Total shipping cost', example: 125.5 })
  cost!: number;

  @ApiProperty({ description: 'Currency', example: 'USD' })
  currency!: string;

  @ApiProperty({ description: 'Minimum transit days', example: 5 })
  minTransitDays!: number;

  @ApiProperty({ description: 'Maximum transit days', example: 14 })
  maxTransitDays!: number;

  @ApiPropertyOptional({ description: 'Insurance cost if applicable', example: 7.5 })
  insuranceCost!: number | null;
}
