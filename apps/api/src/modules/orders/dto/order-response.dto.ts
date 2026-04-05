import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  Address,
  Product,
  ProductVariant,
  User,
  VendorProfile,
  Payment,
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

class OrderBuyerInfoDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
}

class OrderShippingAddressDto {
  @ApiProperty() id!: string;
  @ApiProperty() label!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty() addressLine1!: string;
  @ApiPropertyOptional() addressLine2!: string | null;
  @ApiProperty() city!: string;
  @ApiProperty() state!: string;
  @ApiProperty() postalCode!: string;
  @ApiProperty() country!: string;
  @ApiProperty() phone!: string;
}

class OrderItemVendorInfoDto {
  @ApiProperty() id!: string;
  @ApiProperty() businessName!: string;
  @ApiProperty() businessSlug!: string;
}

class OrderItemResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() productName!: string;
  @ApiPropertyOptional() variantName!: string | null;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() totalPrice!: number;
  @ApiProperty() currency!: string;
  @ApiProperty({ enum: OrderStatus }) status!: OrderStatus;
  @ApiPropertyOptional() trackingNo!: string | null;
  @ApiPropertyOptional({ type: OrderItemVendorInfoDto })
  vendor!: OrderItemVendorInfoDto | null;
  @ApiProperty() createdAt!: Date;
}

type OrderItemWithRelations = OrderItem & {
  product?: Product;
  variant?: ProductVariant | null;
  vendor?: User & {
    vendorProfile?: VendorProfile | null;
  };
};

type OrderWithRelations = Order & {
  buyer?: User;
  shippingAddress?: Address;
  items?: OrderItemWithRelations[];
  payment?: Payment | null;
};

export class OrderResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() orderNumber!: string;
  @ApiProperty({ enum: OrderStatus }) status!: OrderStatus;
  @ApiProperty() subtotal!: number;
  @ApiProperty() shippingCost!: number;
  @ApiProperty() taxAmount!: number;
  @ApiProperty() discountAmount!: number;
  @ApiProperty() totalAmount!: number;
  @ApiProperty() currency!: string;
  @ApiPropertyOptional() notes!: string | null;
  @ApiPropertyOptional() cancelReason!: string | null;

  @ApiPropertyOptional({ type: OrderBuyerInfoDto })
  buyer!: OrderBuyerInfoDto | null;

  @ApiPropertyOptional({ type: OrderShippingAddressDto })
  shippingAddress!: OrderShippingAddressDto | null;

  @ApiPropertyOptional({ type: [OrderItemResponseDto] })
  items!: OrderItemResponseDto[];

  @ApiPropertyOptional({ enum: PaymentStatus })
  paymentStatus!: PaymentStatus | null;

  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  static fromEntity(order: OrderWithRelations): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto.id = order.id;
    dto.orderNumber = order.orderNumber;
    dto.status = order.status;
    dto.subtotal = toNumberRequired(order.subtotal);
    dto.shippingCost = toNumberRequired(order.shippingCost);
    dto.taxAmount = toNumberRequired(order.taxAmount);
    dto.discountAmount = toNumberRequired(order.discountAmount);
    dto.totalAmount = toNumberRequired(order.totalAmount);
    dto.currency = order.currency;
    dto.notes = order.notes;
    dto.cancelReason = order.cancelReason;
    dto.createdAt = order.createdAt;
    dto.updatedAt = order.updatedAt;

    if (order.buyer) {
      dto.buyer = {
        id: order.buyer.id,
        name: `${order.buyer.firstName} ${order.buyer.lastName}`,
        email: order.buyer.email,
      };
    } else {
      dto.buyer = null;
    }

    if (order.shippingAddress) {
      dto.shippingAddress = {
        id: order.shippingAddress.id,
        label: order.shippingAddress.label,
        fullName: order.shippingAddress.fullName,
        addressLine1: order.shippingAddress.addressLine1,
        addressLine2: order.shippingAddress.addressLine2,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
        phone: order.shippingAddress.phone,
      };
    } else {
      dto.shippingAddress = null;
    }

    dto.items = (order.items ?? []).map((item) => {
      const itemDto = new OrderItemResponseDto();
      itemDto.id = item.id;
      itemDto.productName = item.product?.name ?? 'Unknown Product';
      itemDto.variantName = item.variant?.name ?? null;
      itemDto.quantity = item.quantity;
      itemDto.unitPrice = toNumberRequired(item.unitPrice);
      itemDto.totalPrice = toNumberRequired(item.totalPrice);
      itemDto.currency = item.currency;
      itemDto.status = item.status;
      itemDto.trackingNo = item.trackingNo;
      itemDto.createdAt = item.createdAt;

      if (item.vendor?.vendorProfile) {
        itemDto.vendor = {
          id: item.vendor.vendorProfile.id,
          businessName: item.vendor.vendorProfile.businessName,
          businessSlug: item.vendor.vendorProfile.businessSlug,
        };
      } else {
        itemDto.vendor = null;
      }

      return itemDto;
    });

    dto.paymentStatus = order.payment?.status ?? null;

    return dto;
  }
}
