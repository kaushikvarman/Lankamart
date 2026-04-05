import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogisticsPartner, ShippingMode } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

type LogisticsPartnerWithCounts = LogisticsPartner & {
  _count?: { shipments: number };
};

function toNumberFromDecimal(value: Decimal | number): number {
  if (value instanceof Decimal) return value.toNumber();
  return Number(value);
}

export class LogisticsPartnerResponseDto {
  @ApiProperty({ description: 'Partner ID' })
  id!: string;

  @ApiPropertyOptional({ description: 'Linked user ID' })
  userId!: string | null;

  @ApiProperty({ description: 'Company name', example: 'Ceylon Freight Express' })
  companyName!: string;

  @ApiProperty({ description: 'URL slug', example: 'ceylon-freight-express-a3f1' })
  slug!: string;

  @ApiPropertyOptional({ description: 'Company description' })
  description!: string | null;

  @ApiPropertyOptional({ description: 'Logo URL' })
  logoUrl!: string | null;

  @ApiProperty({ description: 'Contact email' })
  contactEmail!: string;

  @ApiProperty({ description: 'Contact phone' })
  contactPhone!: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  website!: string | null;

  @ApiProperty({ description: 'Coverage areas (JSON)' })
  coverageAreas!: string;

  @ApiProperty({ description: 'Supported shipping modes', enum: ShippingMode, isArray: true })
  shippingModes!: ShippingMode[];

  @ApiPropertyOptional({ description: 'Certifications (JSON)' })
  certifications!: string | null;

  @ApiProperty({ description: 'Whether insurance is offered' })
  insuranceOffered!: boolean;

  @ApiProperty({ description: 'Whether tracking is enabled' })
  trackingEnabled!: boolean;

  @ApiPropertyOptional({ description: 'Tracking URL template' })
  trackingUrl!: string | null;

  @ApiProperty({ description: 'Whether the partner is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Whether the partner is verified' })
  isVerified!: boolean;

  @ApiProperty({ description: 'Average rating (0-5)', example: 4.2 })
  averageRating!: number;

  @ApiProperty({ description: 'Total shipment count', example: 1250 })
  shipmentCount!: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt!: Date;

  static fromEntity(partner: LogisticsPartnerWithCounts): LogisticsPartnerResponseDto {
    const dto = new LogisticsPartnerResponseDto();
    dto.id = partner.id;
    dto.userId = partner.userId;
    dto.companyName = partner.companyName;
    dto.slug = partner.slug;
    dto.description = partner.description;
    dto.logoUrl = partner.logoUrl;
    dto.contactEmail = partner.contactEmail;
    dto.contactPhone = partner.contactPhone;
    dto.website = partner.website;
    dto.coverageAreas = partner.coverageAreas;
    dto.shippingModes = JSON.parse(partner.shippingModes) as ShippingMode[];
    dto.certifications = partner.certifications;
    dto.insuranceOffered = partner.insuranceOffered;
    dto.trackingEnabled = partner.trackingEnabled;
    dto.trackingUrl = partner.trackingUrl;
    dto.isActive = partner.isActive;
    dto.isVerified = partner.isVerified;
    dto.averageRating = toNumberFromDecimal(partner.averageRating);
    dto.shipmentCount = partner._count?.shipments ?? 0;
    dto.createdAt = partner.createdAt;
    dto.updatedAt = partner.updatedAt;
    return dto;
  }
}
