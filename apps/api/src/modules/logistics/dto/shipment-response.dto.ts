import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogisticsPartner, Shipment, ShipmentMilestone, ShippingMode } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

type ShipmentWithRelations = Shipment & {
  partner: Pick<LogisticsPartner, 'companyName' | 'slug' | 'trackingUrl' | 'logoUrl'>;
  milestones?: ShipmentMilestone[];
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

export class ShipmentMilestoneResponseDto {
  @ApiProperty({ description: 'Milestone ID' })
  id!: string;

  @ApiProperty({ description: 'Status', example: 'in_transit' })
  status!: string;

  @ApiPropertyOptional({ description: 'Location', example: 'Colombo Port' })
  location!: string | null;

  @ApiPropertyOptional({ description: 'Description' })
  description!: string | null;

  @ApiProperty({ description: 'When the event occurred' })
  occurredAt!: Date;

  @ApiProperty({ description: 'When the milestone was recorded' })
  createdAt!: Date;

  static fromEntity(milestone: ShipmentMilestone): ShipmentMilestoneResponseDto {
    const dto = new ShipmentMilestoneResponseDto();
    dto.id = milestone.id;
    dto.status = milestone.status;
    dto.location = milestone.location;
    dto.description = milestone.description;
    dto.occurredAt = milestone.occurredAt;
    dto.createdAt = milestone.createdAt;
    return dto;
  }
}

export class ShipmentResponseDto {
  @ApiProperty({ description: 'Shipment ID' })
  id!: string;

  @ApiProperty({ description: 'Order item ID' })
  orderItemId!: string;

  @ApiProperty({ description: 'Partner ID' })
  partnerId!: string;

  @ApiProperty({ description: 'Partner company name' })
  partnerName!: string;

  @ApiPropertyOptional({ description: 'Partner logo URL' })
  partnerLogo!: string | null;

  @ApiPropertyOptional({ description: 'Tracking number' })
  trackingNumber!: string | null;

  @ApiPropertyOptional({
    description: 'Full tracking URL with tracking number substituted',
  })
  trackingLink!: string | null;

  @ApiProperty({ description: 'Shipping mode', enum: ShippingMode })
  shippingMode!: ShippingMode;

  @ApiProperty({ description: 'Current status', example: 'in_transit' })
  status!: string;

  @ApiPropertyOptional({ description: 'Package weight (kg)' })
  weight!: number | null;

  @ApiPropertyOptional({ description: 'Package dimensions (LxWxH cm)' })
  dimensions!: string | null;

  @ApiPropertyOptional({ description: 'Declared value' })
  declaredValue!: number | null;

  @ApiProperty({ description: 'Shipping cost' })
  shippingCost!: number;

  @ApiProperty({ description: 'Currency' })
  currency!: string;

  @ApiPropertyOptional({ description: 'Estimated delivery date' })
  estimatedDelivery!: Date | null;

  @ApiPropertyOptional({ description: 'Actual delivery date' })
  actualDelivery!: Date | null;

  @ApiProperty({ description: 'Origin address snapshot (JSON)' })
  originAddress!: string;

  @ApiProperty({ description: 'Destination address snapshot (JSON)' })
  destAddress!: string;

  @ApiPropertyOptional({ description: 'Customs document URL' })
  customsDocUrl!: string | null;

  @ApiPropertyOptional({ description: 'Proof of delivery URL' })
  proofOfDelivery!: string | null;

  @ApiPropertyOptional({ description: 'Notes' })
  notes!: string | null;

  @ApiProperty({ description: 'Tracking milestones', type: [ShipmentMilestoneResponseDto] })
  milestones!: ShipmentMilestoneResponseDto[];

  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt!: Date;

  static fromEntity(shipment: ShipmentWithRelations): ShipmentResponseDto {
    const dto = new ShipmentResponseDto();
    dto.id = shipment.id;
    dto.orderItemId = shipment.orderItemId;
    dto.partnerId = shipment.partnerId;
    dto.partnerName = shipment.partner.companyName;
    dto.partnerLogo = shipment.partner.logoUrl;
    dto.trackingNumber = shipment.trackingNumber;
    dto.trackingLink = buildTrackingLink(
      shipment.partner.trackingUrl,
      shipment.trackingNumber,
    );
    dto.shippingMode = shipment.shippingMode;
    dto.status = shipment.status;
    dto.weight = toNumber(shipment.weight);
    dto.dimensions = shipment.dimensions;
    dto.declaredValue = toNumber(shipment.declaredValue);
    dto.shippingCost = toNumberRequired(shipment.shippingCost);
    dto.currency = shipment.currency;
    dto.estimatedDelivery = shipment.estimatedDelivery;
    dto.actualDelivery = shipment.actualDelivery;
    dto.originAddress = shipment.originAddress;
    dto.destAddress = shipment.destAddress;
    dto.customsDocUrl = shipment.customsDocUrl;
    dto.proofOfDelivery = shipment.proofOfDelivery;
    dto.notes = shipment.notes;
    dto.milestones = (shipment.milestones ?? []).map((m) =>
      ShipmentMilestoneResponseDto.fromEntity(m),
    );
    dto.createdAt = shipment.createdAt;
    dto.updatedAt = shipment.updatedAt;
    return dto;
  }
}

function buildTrackingLink(
  trackingUrlTemplate: string | null,
  trackingNumber: string | null,
): string | null {
  if (!trackingUrlTemplate || !trackingNumber) return null;
  return trackingUrlTemplate.replace('{tracking_number}', trackingNumber);
}
