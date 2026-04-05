import { ApiProperty } from '@nestjs/swagger';
import { Order, OrderItem, OrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

function toNumberRequired(value: Decimal | number): number {
  if (value instanceof Decimal) return value.toNumber();
  return Number(value);
}

type OrderListEntity = Order & {
  items?: OrderItem[];
  _count?: { items: number };
};

export class OrderListItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() orderNumber!: string;
  @ApiProperty({ enum: OrderStatus }) status!: OrderStatus;
  @ApiProperty() totalAmount!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() itemCount!: number;
  @ApiProperty() createdAt!: Date;

  static fromEntity(order: OrderListEntity): OrderListItemDto {
    const dto = new OrderListItemDto();
    dto.id = order.id;
    dto.orderNumber = order.orderNumber;
    dto.status = order.status;
    dto.totalAmount = toNumberRequired(order.totalAmount);
    dto.currency = order.currency;
    dto.itemCount = order._count?.items ?? order.items?.length ?? 0;
    dto.createdAt = order.createdAt;
    return dto;
  }
}
