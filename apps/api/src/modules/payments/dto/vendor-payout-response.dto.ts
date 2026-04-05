import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VendorPayout } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

function toNumberRequired(value: Decimal | number): number {
  if (value instanceof Decimal) return value.toNumber();
  return Number(value);
}

export class VendorPayoutResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() vendorId!: string;
  @ApiProperty() amount!: number;
  @ApiProperty() commission!: number;
  @ApiProperty() commissionRate!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() bankReference!: string | null;
  @ApiPropertyOptional() paidAt!: Date | null;
  @ApiProperty() createdAt!: Date;

  static fromEntity(payout: VendorPayout): VendorPayoutResponseDto {
    const dto = new VendorPayoutResponseDto();
    dto.id = payout.id;
    dto.vendorId = payout.vendorId;
    dto.amount = toNumberRequired(payout.amount);
    dto.commission = toNumberRequired(payout.commission);
    dto.commissionRate = toNumberRequired(payout.commissionRate);
    dto.currency = payout.currency;
    dto.status = payout.status;
    dto.bankReference = payout.bankReference;
    dto.paidAt = payout.paidAt;
    dto.createdAt = payout.createdAt;
    return dto;
  }
}
