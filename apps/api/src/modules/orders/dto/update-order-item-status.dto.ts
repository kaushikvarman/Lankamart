import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { OrderStatus } from '@prisma/client';

const ALLOWED_ITEM_STATUS_UPDATES = [
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
] as const;

export type AllowedItemStatusUpdate = (typeof ALLOWED_ITEM_STATUS_UPDATES)[number];

export class UpdateOrderItemStatusDto {
  @ApiProperty({
    description: 'New item status',
    enum: ALLOWED_ITEM_STATUS_UPDATES,
  })
  @IsEnum(ALLOWED_ITEM_STATUS_UPDATES, {
    message: `status must be one of: ${ALLOWED_ITEM_STATUS_UPDATES.join(', ')}`,
  })
  status!: AllowedItemStatusUpdate;

  @ApiPropertyOptional({
    description: 'Tracking number (required when status is SHIPPED)',
  })
  @ValidateIf((o: UpdateOrderItemStatusDto) => o.status === OrderStatus.SHIPPED)
  @IsString()
  trackingNo?: string;
}
