import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RfqQuote, User, VendorProfile } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

function toNumberRequired(value: Decimal | number): number {
  if (value instanceof Decimal) return value.toNumber();
  return Number(value);
}

class QuoteVendorInfoDto {
  @ApiProperty() id!: string;
  @ApiProperty() businessName!: string;
  @ApiProperty() businessSlug!: string;
  @ApiProperty() isVerified!: boolean;
}

type RfqQuoteWithVendor = RfqQuote & {
  vendor?: User & {
    vendorProfile?: VendorProfile | null;
  };
};

export class RfqQuoteResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() rfqId!: string;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() totalPrice!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() leadTimeDays!: number;
  @ApiProperty() validUntil!: Date;
  @ApiPropertyOptional() notes!: string | null;
  @ApiPropertyOptional({ type: [String] }) attachments!: string[] | null;
  @ApiProperty() isAccepted!: boolean;

  @ApiPropertyOptional({ type: QuoteVendorInfoDto })
  vendor!: QuoteVendorInfoDto | null;

  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  static fromEntity(quote: RfqQuoteWithVendor): RfqQuoteResponseDto {
    const dto = new RfqQuoteResponseDto();
    dto.id = quote.id;
    dto.rfqId = quote.rfqId;
    dto.unitPrice = toNumberRequired(quote.unitPrice);
    dto.totalPrice = toNumberRequired(quote.totalPrice);
    dto.currency = quote.currency;
    dto.leadTimeDays = quote.leadTimeDays;
    dto.validUntil = quote.validUntil;
    dto.notes = quote.notes;
    dto.attachments = quote.attachments
      ? (JSON.parse(quote.attachments) as string[])
      : null;
    dto.isAccepted = quote.isAccepted;
    dto.createdAt = quote.createdAt;
    dto.updatedAt = quote.updatedAt;

    if (quote.vendor?.vendorProfile) {
      dto.vendor = {
        id: quote.vendor.vendorProfile.id,
        businessName: quote.vendor.vendorProfile.businessName,
        businessSlug: quote.vendor.vendorProfile.businessSlug,
        isVerified: quote.vendor.vendorProfile.isVerified,
      };
    } else {
      dto.vendor = null;
    }

    return dto;
  }
}
