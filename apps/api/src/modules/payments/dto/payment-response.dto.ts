import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
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

export class PaymentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() orderId!: string;
  @ApiProperty({ enum: PaymentMethod }) method!: PaymentMethod;
  @ApiProperty({ enum: PaymentStatus }) status!: PaymentStatus;
  @ApiProperty() amount!: number;
  @ApiProperty() currency!: string;
  @ApiPropertyOptional() stripePaymentId!: string | null;
  @ApiPropertyOptional() stripeClientSecret!: string | null;
  @ApiPropertyOptional() bankReference!: string | null;
  @ApiPropertyOptional() paidAt!: Date | null;
  @ApiProperty() refundedAmount!: number;
  @ApiProperty() createdAt!: Date;

  static fromEntity(
    payment: Payment,
    clientSecret?: string | null,
  ): PaymentResponseDto {
    const dto = new PaymentResponseDto();
    dto.id = payment.id;
    dto.orderId = payment.orderId;
    dto.method = payment.method;
    dto.status = payment.status;
    dto.amount = toNumberRequired(payment.amount);
    dto.currency = payment.currency;
    dto.stripePaymentId = payment.stripePaymentId;
    dto.stripeClientSecret = clientSecret ?? null;
    dto.bankReference = payment.bankReference;
    dto.paidAt = payment.paidAt;
    dto.refundedAmount = toNumberRequired(payment.refundedAmount);
    dto.createdAt = payment.createdAt;
    return dto;
  }
}
