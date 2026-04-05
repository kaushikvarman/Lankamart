import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { OrderStatus } from '@prisma/client';

const ALLOWED_ORDER_STATUS_UPDATES = [
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.CANCELLED,
] as const;

export type AllowedOrderStatusUpdate = (typeof ALLOWED_ORDER_STATUS_UPDATES)[number];

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'New order status',
    enum: ALLOWED_ORDER_STATUS_UPDATES,
  })
  @IsEnum(ALLOWED_ORDER_STATUS_UPDATES, {
    message: `status must be one of: ${ALLOWED_ORDER_STATUS_UPDATES.join(', ')}`,
  })
  status!: AllowedOrderStatusUpdate;

  @ApiPropertyOptional({
    description: 'Reason for cancellation (required when status is CANCELLED)',
  })
  @ValidateIf((o: UpdateOrderStatusDto) => o.status === OrderStatus.CANCELLED)
  @IsString()
  cancelReason?: string;
}
