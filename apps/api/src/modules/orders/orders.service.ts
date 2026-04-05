import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, ProductStatus, UserRole } from '@prisma/client';
import * as crypto from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  CreateOrderDto,
  OrderResponseDto,
  OrderListItemDto,
  QueryOrdersDto,
  OrderSortBy,
  UpdateOrderStatusDto,
  UpdateOrderItemStatusDto,
} from './dto';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const ORDER_FULL_INCLUDE = {
  buyer: true,
  shippingAddress: true,
  items: {
    include: {
      product: true,
      variant: true,
      vendor: {
        include: {
          vendorProfile: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  payment: true,
} as const;

const ORDER_LIST_INCLUDE = {
  _count: { select: { items: true } },
} as const;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // CREATE ORDER
  // ---------------------------------------------------------------------------

  async createOrder(
    buyerId: string,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const address = await this.prisma.address.findUnique({
      where: { id: dto.shippingAddressId },
    });

    if (!address || address.userId !== buyerId) {
      throw new NotFoundException(
        `Shipping address with ID "${dto.shippingAddressId}" not found or does not belong to you`,
      );
    }

    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      include: {
        variants: true,
        bulkPricingTiers: { orderBy: { minQty: 'asc' } },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(
          `Product with ID "${item.productId}" not found`,
        );
      }
      if (product.status !== ProductStatus.ACTIVE) {
        throw new BadRequestException(
          `Product "${product.name}" is not available for purchase`,
        );
      }
      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          throw new NotFoundException(
            `Variant with ID "${item.variantId}" not found for product "${product.name}"`,
          );
        }
        if (!variant.isActive) {
          throw new BadRequestException(
            `Variant "${variant.name}" is not active`,
          );
        }
      }
    }

    // FIX 6: Enforce same currency across all products in a single order
    const currencies = new Set(products.map((p) => p.baseCurrency));
    if (currencies.size > 1) {
      throw new BadRequestException(
        'All products in a single order must use the same currency. Found: ' +
          [...currencies].join(', '),
      );
    }
    const orderCurrency = [...currencies][0] ?? 'USD';

    const orderNumber = this.generateOrderNumber();

    const order = await this.createOrderWithRetry(orderNumber, buyerId, dto, productMap, orderCurrency);

    this.logger.log(
      `Order created: ${order.orderNumber} (${order.id}) by buyer ${buyerId} with ${dto.items.length} item(s)`,
    );
    return OrderResponseDto.fromEntity(order);
  }

  private async createOrderWithRetry(
    orderNumber: string,
    buyerId: string,
    dto: CreateOrderDto,
    productMap: Map<string, any>,
    orderCurrency: string,
    maxRetries = 3,
  ) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const currentOrderNumber = attempt === 0 ? orderNumber : this.generateOrderNumber();
        return await this.executeCreateOrderTransaction(currentOrderNumber, buyerId, dto, productMap, orderCurrency);
      } catch (err: any) {
        // P2002 = unique constraint violation (order number collision)
        const isPrismaUniqueError =
          err?.code === 'P2002' ||
          (err?.constructor?.name === 'PrismaClientKnownRequestError' && err?.code === 'P2002');
        if (isPrismaUniqueError && attempt < maxRetries - 1) {
          this.logger.warn(`Order number collision on attempt ${attempt + 1}, retrying...`);
          continue;
        }
        throw err;
      }
    }
    throw new BadRequestException('Failed to generate unique order number after multiple attempts');
  }

  private async executeCreateOrderTransaction(
    orderNumber: string,
    buyerId: string,
    dto: CreateOrderDto,
    productMap: Map<string, any>,
    orderCurrency: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      let subtotal = new Decimal(0);
      const orderItemsData: {
        productId: string;
        variantId: string | null;
        vendorId: string;
        quantity: number;
        unitPrice: Decimal;
        totalPrice: Decimal;
        currency: string;
      }[] = [];

      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        const unitPrice = this.calculateUnitPrice(product, item.quantity, item.variantId);
        const totalPrice = unitPrice.mul(item.quantity);

        subtotal = subtotal.add(totalPrice);

        orderItemsData.push({
          productId: item.productId,
          variantId: item.variantId ?? null,
          vendorId: product.vendorId,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
          currency: product.baseCurrency,
        });

        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          if (!variant || variant.stock < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for variant ${item.variantId}`,
            );
          }
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      const totalAmount = subtotal;

      const created = await tx.order.create({
        data: {
          orderNumber,
          buyerId,
          shippingAddrId: dto.shippingAddressId,
          status: OrderStatus.PENDING,
          subtotal,
          shippingCost: new Decimal(0),
          taxAmount: new Decimal(0),
          discountAmount: new Decimal(0),
          totalAmount,
          currency: orderCurrency,
          notes: dto.notes,
          items: {
            create: orderItemsData.map((itemData) => ({
              productId: itemData.productId,
              variantId: itemData.variantId,
              vendorId: itemData.vendorId,
              quantity: itemData.quantity,
              unitPrice: itemData.unitPrice,
              totalPrice: itemData.totalPrice,
              currency: itemData.currency,
              status: OrderStatus.PENDING,
            })),
          },
        },
        include: ORDER_FULL_INCLUDE,
      });

      await tx.payment.create({
        data: {
          orderId: created.id,
          method: dto.paymentMethod,
          amount: totalAmount,
          currency: orderCurrency,
          status: 'PENDING',
        },
      });

      return tx.order.findUniqueOrThrow({
        where: { id: created.id },
        include: ORDER_FULL_INCLUDE,
      });
    });
  }

  // ---------------------------------------------------------------------------
  // FIND BY ID
  // ---------------------------------------------------------------------------

  async findById(
    orderId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_FULL_INCLUDE,
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }

    this.assertOrderAccess(order, userId, userRole);

    return OrderResponseDto.fromEntity(order);
  }

  // ---------------------------------------------------------------------------
  // LIST BUYER ORDERS
  // ---------------------------------------------------------------------------

  async listBuyerOrders(
    buyerId: string,
    query: QueryOrdersDto,
  ): Promise<PaginatedResponse<OrderListItemDto>> {
    const where: Prisma.OrderWhereInput = { buyerId };
    this.applyOrderFilters(where, query);

    return this.paginateOrders(where, query);
  }

  // ---------------------------------------------------------------------------
  // LIST VENDOR ORDERS (items belonging to this vendor)
  // ---------------------------------------------------------------------------

  async listVendorOrders(
    vendorId: string,
    query: QueryOrdersDto,
  ): Promise<PaginatedResponse<OrderListItemDto>> {
    const where: Prisma.OrderWhereInput = {
      items: { some: { vendorId } },
    };
    this.applyOrderFilters(where, query);

    return this.paginateOrders(where, query);
  }

  // ---------------------------------------------------------------------------
  // LIST ALL ORDERS (admin)
  // ---------------------------------------------------------------------------

  async listAllOrders(
    query: QueryOrdersDto,
  ): Promise<PaginatedResponse<OrderListItemDto>> {
    const where: Prisma.OrderWhereInput = {};
    this.applyOrderFilters(where, query);

    return this.paginateOrders(where, query);
  }

  // ---------------------------------------------------------------------------
  // UPDATE ORDER STATUS
  // ---------------------------------------------------------------------------

  async updateOrderStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    userId: string,
    userRole: UserRole,
  ): Promise<OrderResponseDto> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new NotFoundException(`Order with ID "${orderId}" not found`);
      }

      this.validateOrderStatusTransition(order.status, dto.status, userRole, order, userId);

      const updateData: Prisma.OrderUpdateInput = { status: dto.status };

      if (dto.status === OrderStatus.CANCELLED) {
        updateData.cancelReason = dto.cancelReason;
        updateData.cancelledAt = new Date();

        // Restore stock for all items with variants
        const items = await tx.orderItem.findMany({ where: { orderId } });
        for (const item of items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          }
          await tx.orderItem.update({
            where: { id: item.id },
            data: { status: OrderStatus.CANCELLED },
          });
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: ORDER_FULL_INCLUDE,
      });
    });

    this.logger.log(
      `Order status updated: ${orderId} -> ${dto.status} by user ${userId}`,
    );
    return OrderResponseDto.fromEntity(updated);
  }

  // ---------------------------------------------------------------------------
  // UPDATE ORDER ITEM STATUS (vendor)
  // ---------------------------------------------------------------------------

  async updateOrderItemStatus(
    itemId: string,
    dto: UpdateOrderItemStatusDto,
    vendorId: string,
  ): Promise<OrderResponseDto> {
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const item = await tx.orderItem.findUnique({
        where: { id: itemId },
        include: { order: { include: { items: true } } },
      });

      if (!item) {
        throw new NotFoundException(`Order item with ID "${itemId}" not found`);
      }

      if (item.vendorId !== vendorId) {
        throw new ForbiddenException('You can only update your own order items');
      }

      this.validateItemStatusTransition(item.status, dto.status);

      const itemUpdate: Prisma.OrderItemUpdateInput = { status: dto.status };

      if (dto.status === OrderStatus.SHIPPED) {
        if (!dto.trackingNo) {
          throw new BadRequestException(
            'Tracking number is required when marking item as shipped',
          );
        }
        itemUpdate.trackingNo = dto.trackingNo;
        itemUpdate.shippedAt = new Date();
      }

      if (dto.status === OrderStatus.DELIVERED) {
        itemUpdate.deliveredAt = new Date();
      }

      await tx.orderItem.update({
        where: { id: itemId },
        data: itemUpdate,
      });

      const allItems = await tx.orderItem.findMany({
        where: { orderId: item.orderId },
      });

      const newOrderStatus = this.deriveOrderStatus(allItems, dto.status, itemId);

      if (newOrderStatus && newOrderStatus !== item.order.status) {
        const orderUpdate: Prisma.OrderUpdateInput = { status: newOrderStatus };
        if (newOrderStatus === OrderStatus.DELIVERED) {
          orderUpdate.deliveredAt = new Date();
        }
        await tx.order.update({
          where: { id: item.orderId },
          data: orderUpdate,
        });
      }

      return tx.order.findUniqueOrThrow({
        where: { id: item.orderId },
        include: ORDER_FULL_INCLUDE,
      });
    });

    this.logger.log(
      `Order item status updated: ${itemId} -> ${dto.status} by vendor ${vendorId}`,
    );
    return OrderResponseDto.fromEntity(updatedOrder);
  }

  // ---------------------------------------------------------------------------
  // CANCEL ORDER (buyer)
  // ---------------------------------------------------------------------------

  async cancelOrder(
    orderId: string,
    buyerId: string,
    reason: string,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { variant: true } } },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found`);
    }

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    const hasShippedItems = order.items.some(
      (item) =>
        item.status === OrderStatus.SHIPPED ||
        item.status === OrderStatus.DELIVERED,
    );

    if (hasShippedItems) {
      throw new BadRequestException(
        'Cannot cancel an order that has shipped or delivered items',
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      await tx.orderItem.updateMany({
        where: { orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelReason: reason,
          cancelledAt: new Date(),
        },
        include: ORDER_FULL_INCLUDE,
      });
    });

    this.logger.log(
      `Order cancelled: ${orderId} by buyer ${buyerId}. Reason: ${reason}`,
    );
    return OrderResponseDto.fromEntity(updatedOrder);
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  private generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `LM-${year}${month}${day}-${hex}`;
  }

  private calculateUnitPrice(
    product: {
      basePrice: Decimal;
      bulkPricingTiers: { minQty: number; maxQty: number | null; price: Decimal }[];
      variants: { id: string; price: Decimal }[];
    },
    quantity: number,
    variantId?: string,
  ): Decimal {
    let basePrice: Decimal;

    if (variantId) {
      const variant = product.variants.find((v) => v.id === variantId);
      basePrice = variant ? variant.price : product.basePrice;
    } else {
      basePrice = product.basePrice;
    }

    if (product.bulkPricingTiers.length > 0) {
      const sortedTiers = [...product.bulkPricingTiers].sort(
        (a, b) => b.minQty - a.minQty,
      );

      for (const tier of sortedTiers) {
        if (
          quantity >= tier.minQty &&
          (tier.maxQty === null || quantity <= tier.maxQty)
        ) {
          return tier.price;
        }
      }
    }

    return basePrice;
  }

  private validateOrderStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
    userRole: UserRole,
    order: { items: { vendorId: string }[] },
    userId: string,
  ): void {
    if (newStatus === OrderStatus.CONFIRMED) {
      if (currentStatus !== OrderStatus.PENDING) {
        throw new BadRequestException(
          `Cannot transition from ${currentStatus} to CONFIRMED`,
        );
      }
      const isAdmin =
        userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
      const vendorIds = new Set(order.items.map((i) => i.vendorId));
      const isSingleVendorOrder =
        vendorIds.size === 1 && vendorIds.has(userId);

      if (!isAdmin && !isSingleVendorOrder) {
        throw new ForbiddenException(
          'Only admins or the sole vendor of a single-vendor order can confirm orders',
        );
      }
      return;
    }

    if (newStatus === OrderStatus.PROCESSING) {
      if (currentStatus !== OrderStatus.CONFIRMED) {
        throw new BadRequestException(
          `Cannot transition from ${currentStatus} to PROCESSING`,
        );
      }
      return;
    }

    if (newStatus === OrderStatus.CANCELLED) {
      const isAdmin =
        userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
      const nonCancellable: OrderStatus[] = [
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
        OrderStatus.RETURNED,
        OrderStatus.REFUNDED,
      ];

      if (nonCancellable.includes(currentStatus)) {
        throw new BadRequestException(
          `Cannot cancel an order with status ${currentStatus}`,
        );
      }

      if (!isAdmin && userRole === UserRole.BUYER) {
        const hasShipped = order.items.some(
          (i) =>
            (i as { vendorId: string; status?: OrderStatus }).status ===
            OrderStatus.SHIPPED,
        );
        if (hasShipped) {
          throw new BadRequestException(
            'Buyer cannot cancel an order that has shipped items',
          );
        }
      }
      return;
    }

    throw new BadRequestException(
      `Invalid status transition: ${currentStatus} -> ${newStatus}`,
    );
  }

  private validateItemStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): void {
    const validTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
      [OrderStatus.PENDING]: [OrderStatus.PROCESSING],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
    };

    const allowed = validTransitions[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition item from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private deriveOrderStatus(
    allItems: { id: string; status: OrderStatus }[],
    updatedStatus: OrderStatus,
    updatedItemId: string,
  ): OrderStatus | null {
    const effectiveStatuses = allItems.map((item) =>
      item.id === updatedItemId ? updatedStatus : item.status,
    );

    const allDelivered = effectiveStatuses.every(
      (s) => s === OrderStatus.DELIVERED,
    );
    if (allDelivered) return OrderStatus.DELIVERED;

    const allShippedOrDelivered = effectiveStatuses.every(
      (s) => s === OrderStatus.SHIPPED || s === OrderStatus.DELIVERED,
    );
    if (allShippedOrDelivered) return OrderStatus.SHIPPED;

    const someShipped = effectiveStatuses.some(
      (s) => s === OrderStatus.SHIPPED || s === OrderStatus.DELIVERED,
    );
    if (someShipped) return OrderStatus.PARTIALLY_SHIPPED;

    return null;
  }

  private applyOrderFilters(
    where: Prisma.OrderWhereInput,
    query: QueryOrdersDto,
  ): void {
    if (query.status) {
      where.status = query.status;
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.createdAt.lte = new Date(query.dateTo);
      }
    }
  }

  private async paginateOrders(
    where: Prisma.OrderWhereInput,
    query: QueryOrdersDto,
  ): Promise<PaginatedResponse<OrderListItemDto>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const orderBy = this.buildOrderSortOrder(query.sortBy);

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: ORDER_LIST_INCLUDE,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: orders.map((o) => OrderListItemDto.fromEntity(o)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  private buildOrderSortOrder(
    sortBy?: OrderSortBy,
  ): Prisma.OrderOrderByWithRelationInput[] {
    switch (sortBy) {
      case OrderSortBy.OLDEST:
        return [{ createdAt: 'asc' }];
      case OrderSortBy.AMOUNT_ASC:
        return [{ totalAmount: 'asc' }];
      case OrderSortBy.AMOUNT_DESC:
        return [{ totalAmount: 'desc' }];
      case OrderSortBy.NEWEST:
      default:
        return [{ createdAt: 'desc' }];
    }
  }

  private assertOrderAccess(
    order: { buyerId: string; items?: { vendorId: string }[] },
    userId: string,
    userRole: UserRole,
  ): void {
    if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) {
      return;
    }

    if (userRole === UserRole.BUYER && order.buyerId === userId) {
      return;
    }

    if (userRole === UserRole.VENDOR) {
      const hasVendorItems = order.items?.some(
        (item) => item.vendorId === userId,
      );
      if (hasVendorItems) return;
    }

    throw new ForbiddenException('You do not have access to this order');
  }
}
