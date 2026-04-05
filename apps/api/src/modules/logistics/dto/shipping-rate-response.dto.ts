import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogisticsPartner, ShippingMode, ShippingRate, ShippingZone } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

type ShippingRateWithRelations = ShippingRate & {
  partner: Pick<LogisticsPartner, 'companyName'>;
  originZone: Pick<ShippingZone, 'name'>;
  destinationZone: Pick<ShippingZone, 'name'>;
};

function toNumber(value: Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Decimal) return value.toNumber();
  return Number(value);
}

function toNumberRequired(value: Decimal | number): number {
  if (value instanceof Decimal) return value.toNumber();
  return Number(value);
}

export class ShippingRateResponseDto {
  @ApiProperty({ description: 'Rate ID' })
  id!: string;

  @ApiProperty({ description: 'Partner ID' })
  partnerId!: string;

  @ApiProperty({ description: 'Partner company name' })
  partnerName!: string;

  @ApiProperty({ description: 'Origin zone ID' })
  originZoneId!: string;

  @ApiProperty({ description: 'Origin zone name' })
  originZoneName!: string;

  @ApiProperty({ description: 'Destination zone ID' })
  destinationZoneId!: string;

  @ApiProperty({ description: 'Destination zone name' })
  destinationZoneName!: string;

  @ApiProperty({ description: 'Shipping mode', enum: ShippingMode })
  shippingMode!: ShippingMode;

  @ApiProperty({ description: 'Currency', example: 'USD' })
  currency!: string;

  @ApiProperty({ description: 'Base rate', example: 50.0 })
  baseRate!: number;

  @ApiProperty({ description: 'Per kg rate', example: 2.5 })
  perKgRate!: number;

  @ApiPropertyOptional({ description: 'Per CBM rate (sea freight)', example: 150.0 })
  perCbmRate!: number | null;

  @ApiProperty({ description: 'Minimum chargeable weight (kg)', example: 0 })
  minWeight!: number;

  @ApiPropertyOptional({ description: 'Maximum weight per shipment (kg)', example: 1000 })
  maxWeight!: number | null;

  @ApiProperty({ description: 'Minimum transit days', example: 5 })
  minTransitDays!: number;

  @ApiProperty({ description: 'Maximum transit days', example: 14 })
  maxTransitDays!: number;

  @ApiProperty({ description: 'Fuel surcharge percentage', example: 5.0 })
  fuelSurcharge!: number;

  @ApiPropertyOptional({ description: 'Insurance rate percentage', example: 1.5 })
  insuranceRate!: number | null;

  @ApiProperty({ description: 'Whether the rate is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Rate valid from' })
  validFrom!: Date;

  @ApiPropertyOptional({ description: 'Rate valid until' })
  validUntil!: Date | null;

  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt!: Date;

  static fromEntity(rate: ShippingRateWithRelations): ShippingRateResponseDto {
    const dto = new ShippingRateResponseDto();
    dto.id = rate.id;
    dto.partnerId = rate.partnerId;
    dto.partnerName = rate.partner.companyName;
    dto.originZoneId = rate.originZoneId;
    dto.originZoneName = rate.originZone.name;
    dto.destinationZoneId = rate.destinationZoneId;
    dto.destinationZoneName = rate.destinationZone.name;
    dto.shippingMode = rate.shippingMode;
    dto.currency = rate.currency;
    dto.baseRate = toNumberRequired(rate.baseRate);
    dto.perKgRate = toNumberRequired(rate.perKgRate);
    dto.perCbmRate = toNumber(rate.perCbmRate);
    dto.minWeight = toNumberRequired(rate.minWeight);
    dto.maxWeight = toNumber(rate.maxWeight);
    dto.minTransitDays = rate.minTransitDays;
    dto.maxTransitDays = rate.maxTransitDays;
    dto.fuelSurcharge = toNumberRequired(rate.fuelSurcharge);
    dto.insuranceRate = toNumber(rate.insuranceRate);
    dto.isActive = rate.isActive;
    dto.validFrom = rate.validFrom;
    dto.validUntil = rate.validUntil;
    dto.createdAt = rate.createdAt;
    dto.updatedAt = rate.updatedAt;
    return dto;
  }
}
