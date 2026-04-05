import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Rfq,
  RfqQuote,
  RfqStatus,
  User,
  Product,
  VendorProfile,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

function toNumber(value: Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Decimal) return value.toNumber();
  return Number(value);
}

function toNumberRequired(value: Decimal | number): number {
  if (value instanceof Decimal) return value.toNumber();
  return Number(value);
}

class RfqBuyerInfoDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
}

class RfqProductInfoDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
}

class RfqQuoteVendorInfoDto {
  @ApiProperty() id!: string;
  @ApiProperty() businessName!: string;
  @ApiProperty() businessSlug!: string;
}

class RfqQuoteItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() totalPrice!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() leadTimeDays!: number;
  @ApiProperty() validUntil!: Date;
  @ApiPropertyOptional() notes!: string | null;
  @ApiPropertyOptional({ type: [String] }) attachments!: string[] | null;
  @ApiProperty() isAccepted!: boolean;
  @ApiPropertyOptional({ type: RfqQuoteVendorInfoDto })
  vendor!: RfqQuoteVendorInfoDto | null;
  @ApiProperty() createdAt!: Date;
}

type RfqQuoteWithVendor = RfqQuote & {
  vendor?: User & {
    vendorProfile?: VendorProfile | null;
  };
};

type RfqWithRelations = Rfq & {
  buyer?: User;
  product?: Product | null;
  quotes?: RfqQuoteWithVendor[];
};

export class RfqResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() description!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() unit!: string;
  @ApiPropertyOptional() targetPrice!: number | null;
  @ApiProperty() currency!: string;
  @ApiProperty() deliveryAddress!: string;
  @ApiPropertyOptional() requiredBy!: Date | null;
  @ApiPropertyOptional({ type: [String] }) attachments!: string[] | null;
  @ApiProperty({ enum: RfqStatus }) status!: RfqStatus;
  @ApiProperty() expiresAt!: Date;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  @ApiPropertyOptional({ type: RfqBuyerInfoDto })
  buyer!: RfqBuyerInfoDto | null;

  @ApiPropertyOptional({ type: RfqProductInfoDto })
  product!: RfqProductInfoDto | null;

  @ApiPropertyOptional({ type: [RfqQuoteItemDto] })
  quotes!: RfqQuoteItemDto[];

  static fromEntity(rfq: RfqWithRelations): RfqResponseDto {
    const dto = new RfqResponseDto();
    dto.id = rfq.id;
    dto.title = rfq.title;
    dto.description = rfq.description;
    dto.quantity = rfq.quantity;
    dto.unit = rfq.unit;
    dto.targetPrice = toNumber(rfq.targetPrice);
    dto.currency = rfq.currency;
    dto.deliveryAddress = rfq.deliveryAddr;
    dto.requiredBy = rfq.requiredBy;
    dto.attachments = rfq.attachments
      ? (JSON.parse(rfq.attachments) as string[])
      : null;
    dto.status = rfq.status;
    dto.expiresAt = rfq.expiresAt;
    dto.createdAt = rfq.createdAt;
    dto.updatedAt = rfq.updatedAt;

    if (rfq.buyer) {
      dto.buyer = {
        id: rfq.buyer.id,
        name: `${rfq.buyer.firstName} ${rfq.buyer.lastName}`,
        email: rfq.buyer.email,
      };
    } else {
      dto.buyer = null;
    }

    if (rfq.product) {
      dto.product = {
        id: rfq.product.id,
        name: rfq.product.name,
        slug: rfq.product.slug,
      };
    } else {
      dto.product = null;
    }

    dto.quotes = (rfq.quotes ?? []).map((quote) => {
      const quoteDto = new RfqQuoteItemDto();
      quoteDto.id = quote.id;
      quoteDto.unitPrice = toNumberRequired(quote.unitPrice);
      quoteDto.totalPrice = toNumberRequired(quote.totalPrice);
      quoteDto.currency = quote.currency;
      quoteDto.leadTimeDays = quote.leadTimeDays;
      quoteDto.validUntil = quote.validUntil;
      quoteDto.notes = quote.notes;
      quoteDto.attachments = quote.attachments
        ? (JSON.parse(quote.attachments) as string[])
        : null;
      quoteDto.isAccepted = quote.isAccepted;
      quoteDto.createdAt = quote.createdAt;

      if (quote.vendor?.vendorProfile) {
        quoteDto.vendor = {
          id: quote.vendor.vendorProfile.id,
          businessName: quote.vendor.vendorProfile.businessName,
          businessSlug: quote.vendor.vendorProfile.businessSlug,
        };
      } else {
        quoteDto.vendor = null;
      }

      return quoteDto;
    });

    return dto;
  }
}
