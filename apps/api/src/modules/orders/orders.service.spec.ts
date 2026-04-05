import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod, ProductStatus, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '@/common/prisma/prisma.service';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateOrderItemStatusDto } from './dto/update-order-item-status.dto';

const MOCK_BUYER_ID = 'buyer-001';
const MOCK_VENDOR_ID = 'vendor-001';
const MOCK_VENDOR_ID_2 = 'vendor-002';
const MOCK_ORDER_ID = 'order-001';
const MOCK_ITEM_ID = 'item-001';
const MOCK_ITEM_ID_2 = 'item-002';
const MOCK_PRODUCT_ID = 'product-001';
const MOCK_PRODUCT_ID_2 = 'product-002';
const MOCK_VARIANT_ID = 'variant-001';
const MOCK_ADDRESS_ID = 'address-001';

const mockAddress = {
  id: MOCK_ADDRESS_ID,
  userId: MOCK_BUYER_ID,
  label: 'home',
  fullName: 'John Doe',
  addressLine1: '123 Main St',
  addressLine2: null,
  city: 'Colombo',
  state: 'Western',
  postalCode: '00100',
  country: 'LK',
  phone: '+94771234567',
  isDefault: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockProduct = {
  id: MOCK_PRODUCT_ID,
  vendorId: MOCK_VENDOR_ID,
  categoryId: 'cat-001',
  name: 'Ceylon Cinnamon',
  slug: 'ceylon-cinnamon-abc123',
  description: 'Premium Ceylon cinnamon',
  shortDesc: null,
  status: ProductStatus.ACTIVE,
  baseCurrency: 'USD',
  basePrice: new Decimal('29.99'),
  comparePrice: null,
  costPrice: null,
  moq: 1,
  maxQty: null,
  unit: 'piece',
  weight: null,
  length: null,
  width: null,
  height: null,
  hsCode: null,
  originCountry: 'LK',
  tags: null,
  isFeatured: false,
  averageRating: new Decimal('0'),
  totalReviews: 0,
  totalSold: 0,
  viewCount: 0,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  deletedAt: null,
  variants: [
    {
      id: MOCK_VARIANT_ID,
      productId: MOCK_PRODUCT_ID,
      sku: 'CIN-100G',
      name: '100g Pack',
      price: new Decimal('29.99'),
      stock: 100,
      lowStockAt: 5,
      weight: null,
      imageUrl: null,
      attributes: '{"weight":"100g"}',
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    },
  ],
  bulkPricingTiers: [
    {
      id: 'tier-001',
      productId: MOCK_PRODUCT_ID,
      minQty: 10,
      maxQty: 49,
      price: new Decimal('24.99'),
    },
    {
      id: 'tier-002',
      productId: MOCK_PRODUCT_ID,
      minQty: 50,
      maxQty: null,
      price: new Decimal('19.99'),
    },
  ],
};

const mockProduct2 = {
  ...mockProduct,
  id: MOCK_PRODUCT_ID_2,
  vendorId: MOCK_VENDOR_ID_2,
  name: 'Black Pepper',
  slug: 'black-pepper-def456',
  basePrice: new Decimal('15.00'),
  variants: [],
  bulkPricingTiers: [],
};

const mockVendorProfile = {
  id: 'vp-001',
  businessName: 'Ceylon Spices Co.',
  businessSlug: 'ceylon-spices-co',
  isVerified: true,
};

const mockBuyer = {
  id: MOCK_BUYER_ID,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
};

const mockOrderItem = {
  id: MOCK_ITEM_ID,
  orderId: MOCK_ORDER_ID,
  productId: MOCK_PRODUCT_ID,
  variantId: MOCK_VARIANT_ID,
  vendorId: MOCK_VENDOR_ID,
  quantity: 5,
  unitPrice: new Decimal('29.99'),
  totalPrice: new Decimal('149.95'),
  currency: 'USD',
  status: OrderStatus.PENDING,
  trackingNo: null,
  shippedAt: null,
  deliveredAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockOrderItem2 = {
  ...mockOrderItem,
  id: MOCK_ITEM_ID_2,
  productId: MOCK_PRODUCT_ID_2,
  variantId: null,
  vendorId: MOCK_VENDOR_ID_2,
  unitPrice: new Decimal('15.00'),
  totalPrice: new Decimal('30.00'),
};

const mockOrder = {
  id: MOCK_ORDER_ID,
  orderNumber: 'LM-20260405-A1B2',
  buyerId: MOCK_BUYER_ID,
  shippingAddrId: MOCK_ADDRESS_ID,
  status: OrderStatus.PENDING,
  subtotal: new Decimal('179.95'),
  shippingCost: new Decimal('0'),
  taxAmount: new Decimal('0'),
  discountAmount: new Decimal('0'),
  totalAmount: new Decimal('179.95'),
  currency: 'USD',
  notes: null,
  cancelReason: null,
  cancelledAt: null,
  deliveredAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  buyer: mockBuyer,
  shippingAddress: mockAddress,
  items: [
    {
      ...mockOrderItem,
      product: mockProduct,
      variant: mockProduct.variants[0],
      vendor: { vendorProfile: mockVendorProfile },
    },
    {
      ...mockOrderItem2,
      product: mockProduct2,
      variant: null,
      vendor: { vendorProfile: { ...mockVendorProfile, id: 'vp-002', businessName: 'Pepper Ltd.' } },
    },
  ],
  payment: { status: 'PENDING' },
};

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: {
    address: { findUnique: jest.Mock };
    product: { findMany: jest.Mock };
    productVariant: { update: jest.Mock };
    order: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    orderItem: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    payment: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      address: { findUnique: jest.fn() },
      product: { findMany: jest.fn() },
      productVariant: { update: jest.fn() },
      order: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      orderItem: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      payment: { create: jest.fn() },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  // ---------------------------------------------------------------------------
  // createOrder
  // ---------------------------------------------------------------------------
  describe('createOrder', () => {
    const dto: CreateOrderDto = {
      items: [
        { productId: MOCK_PRODUCT_ID, variantId: MOCK_VARIANT_ID, quantity: 5 },
        { productId: MOCK_PRODUCT_ID_2, quantity: 2 },
      ],
      shippingAddressId: MOCK_ADDRESS_ID,
      paymentMethod: PaymentMethod.STRIPE_CARD,
    };

    it('should create an order with multiple items from different vendors', async () => {
      prisma.address.findUnique.mockResolvedValue(mockAddress);
      prisma.product.findMany.mockResolvedValue([mockProduct, mockProduct2]);
      prisma.$transaction.mockImplementation(
        async (fn: (tx: typeof prisma) => Promise<typeof mockOrder>) => fn(prisma),
      );
      prisma.productVariant.update.mockResolvedValue({ stock: 95 });
      prisma.order.create.mockResolvedValue({ id: MOCK_ORDER_ID });
      prisma.payment.create.mockResolvedValue({ id: 'payment-001' });
      prisma.order.findUniqueOrThrow.mockResolvedValue(mockOrder);

      const result = await service.createOrder(MOCK_BUYER_ID, dto);

      expect(result.orderNumber).toBe('LM-20260405-A1B2');
      expect(result.items).toHaveLength(2);
      expect(result.subtotal).toBeCloseTo(179.95);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: MOCK_VARIANT_ID },
        data: { stock: { decrement: 5 } },
      });
    });

    it('should throw NotFoundException when product does not exist', async () => {
      prisma.address.findUnique.mockResolvedValue(mockAddress);
      prisma.product.findMany.mockResolvedValue([]);

      await expect(
        service.createOrder(MOCK_BUYER_ID, {
          items: [{ productId: 'nonexistent', quantity: 1 }],
          shippingAddressId: MOCK_ADDRESS_ID,
          paymentMethod: PaymentMethod.STRIPE_CARD,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when address not found', async () => {
      prisma.address.findUnique.mockResolvedValue(null);

      await expect(
        service.createOrder(MOCK_BUYER_ID, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when product is not ACTIVE', async () => {
      prisma.address.findUnique.mockResolvedValue(mockAddress);
      prisma.product.findMany.mockResolvedValue([
        { ...mockProduct, status: ProductStatus.DRAFT },
        mockProduct2,
      ]);

      await expect(
        service.createOrder(MOCK_BUYER_ID, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when variant has insufficient stock', async () => {
      prisma.address.findUnique.mockResolvedValue(mockAddress);
      prisma.product.findMany.mockResolvedValue([
        {
          ...mockProduct,
          variants: [{ ...mockProduct.variants[0], stock: 2 }],
        },
        mockProduct2,
      ]);

      await expect(
        service.createOrder(MOCK_BUYER_ID, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should apply bulk pricing when quantity meets threshold', async () => {
      const bulkDto: CreateOrderDto = {
        items: [
          { productId: MOCK_PRODUCT_ID, variantId: MOCK_VARIANT_ID, quantity: 15 },
        ],
        shippingAddressId: MOCK_ADDRESS_ID,
        paymentMethod: PaymentMethod.STRIPE_CARD,
      };

      prisma.address.findUnique.mockResolvedValue(mockAddress);
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      prisma.$transaction.mockImplementation(
        async (fn: (tx: typeof prisma) => Promise<typeof mockOrder>) => fn(prisma),
      );
      prisma.productVariant.update.mockResolvedValue({ stock: 85 });

      const expectedUnitPrice = new Decimal('24.99');
      const expectedTotal = expectedUnitPrice.mul(15);

      prisma.order.create.mockResolvedValue({ id: MOCK_ORDER_ID });
      prisma.payment.create.mockResolvedValue({ id: 'payment-001' });
      prisma.order.findUniqueOrThrow.mockResolvedValue({
        ...mockOrder,
        subtotal: expectedTotal,
        totalAmount: expectedTotal,
        items: [
          {
            ...mockOrder.items[0],
            quantity: 15,
            unitPrice: expectedUnitPrice,
            totalPrice: expectedTotal,
          },
        ],
      });

      const result = await service.createOrder(MOCK_BUYER_ID, bulkDto);

      expect(result.items[0]!.unitPrice).toBeCloseTo(24.99);
      expect(result.items[0]!.totalPrice).toBeCloseTo(374.85);
    });
  });

  // ---------------------------------------------------------------------------
  // findById
  // ---------------------------------------------------------------------------
  describe('findById', () => {
    it('should return order for the buyer', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findById(MOCK_ORDER_ID, MOCK_BUYER_ID, UserRole.BUYER);

      expect(result.id).toBe(MOCK_ORDER_ID);
    });

    it('should return order for a vendor whose items are in the order', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findById(MOCK_ORDER_ID, MOCK_VENDOR_ID, UserRole.VENDOR);

      expect(result.id).toBe(MOCK_ORDER_ID);
    });

    it('should return order for admin', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findById(MOCK_ORDER_ID, 'admin-001', UserRole.ADMIN);

      expect(result.id).toBe(MOCK_ORDER_ID);
    });

    it('should throw ForbiddenException when buyer tries to access another buyers order', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.findById(MOCK_ORDER_ID, 'other-buyer', UserRole.BUYER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when vendor has no items in the order', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.findById(MOCK_ORDER_ID, 'other-vendor', UserRole.VENDOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent order', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.findById('nonexistent', MOCK_BUYER_ID, UserRole.BUYER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // updateOrderStatus
  // ---------------------------------------------------------------------------
  describe('updateOrderStatus', () => {
    it('should allow admin to confirm a PENDING order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PENDING,
        items: [mockOrderItem, mockOrderItem2],
      });
      prisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
      });

      const dto: UpdateOrderStatusDto = { status: OrderStatus.CONFIRMED };
      const result = await service.updateOrderStatus(
        MOCK_ORDER_ID,
        dto,
        'admin-001',
        UserRole.ADMIN,
      );

      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should allow sole vendor to confirm single-vendor PENDING order', async () => {
      const singleVendorOrder = {
        ...mockOrder,
        status: OrderStatus.PENDING,
        items: [mockOrderItem],
      };
      prisma.order.findUnique.mockResolvedValue(singleVendorOrder);
      prisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
      });

      const dto: UpdateOrderStatusDto = { status: OrderStatus.CONFIRMED };
      const result = await service.updateOrderStatus(
        MOCK_ORDER_ID,
        dto,
        MOCK_VENDOR_ID,
        UserRole.VENDOR,
      );

      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should reject CONFIRMED -> PENDING transition', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
        items: [mockOrderItem],
      });

      await expect(
        service.updateOrderStatus(
          MOCK_ORDER_ID,
          { status: OrderStatus.CONFIRMED } as UpdateOrderStatusDto,
          'admin-001',
          UserRole.ADMIN,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject cancelling a DELIVERED order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.DELIVERED,
        items: [mockOrderItem],
      });

      await expect(
        service.updateOrderStatus(
          MOCK_ORDER_ID,
          { status: OrderStatus.CANCELLED, cancelReason: 'test' } as UpdateOrderStatusDto,
          'admin-001',
          UserRole.ADMIN,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should transition CONFIRMED -> PROCESSING', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
        items: [mockOrderItem],
      });
      prisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PROCESSING,
      });

      const result = await service.updateOrderStatus(
        MOCK_ORDER_ID,
        { status: OrderStatus.PROCESSING } as UpdateOrderStatusDto,
        'admin-001',
        UserRole.ADMIN,
      );

      expect(result.status).toBe(OrderStatus.PROCESSING);
    });

    it('should throw NotFoundException for non-existent order', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus(
          'nonexistent',
          { status: OrderStatus.CONFIRMED } as UpdateOrderStatusDto,
          'admin-001',
          UserRole.ADMIN,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // updateOrderItemStatus
  // ---------------------------------------------------------------------------
  describe('updateOrderItemStatus', () => {
    it('should allow vendor to update their own item to PROCESSING', async () => {
      prisma.orderItem.findUnique.mockResolvedValue({
        ...mockOrderItem,
        status: OrderStatus.PENDING,
        order: { ...mockOrder, items: [mockOrderItem] },
      });
      prisma.orderItem.update.mockResolvedValue({
        ...mockOrderItem,
        status: OrderStatus.PROCESSING,
      });
      prisma.orderItem.findMany.mockResolvedValue([
        { ...mockOrderItem, status: OrderStatus.PENDING },
      ]);
      prisma.order.findUniqueOrThrow.mockResolvedValue({
        ...mockOrder,
        items: [{ ...mockOrder.items[0], status: OrderStatus.PROCESSING }],
      });

      const dto: UpdateOrderItemStatusDto = { status: OrderStatus.PROCESSING };
      const result = await service.updateOrderItemStatus(MOCK_ITEM_ID, dto, MOCK_VENDOR_ID);

      expect(result.items[0]!.status).toBe(OrderStatus.PROCESSING);
    });

    it('should require tracking number when shipping', async () => {
      prisma.orderItem.findUnique.mockResolvedValue({
        ...mockOrderItem,
        status: OrderStatus.PROCESSING,
        order: { ...mockOrder, items: [mockOrderItem] },
      });

      const dto: UpdateOrderItemStatusDto = { status: OrderStatus.SHIPPED };

      await expect(
        service.updateOrderItemStatus(MOCK_ITEM_ID, dto, MOCK_VENDOR_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update item to SHIPPED with tracking number', async () => {
      prisma.orderItem.findUnique.mockResolvedValue({
        ...mockOrderItem,
        status: OrderStatus.PROCESSING,
        order: { ...mockOrder, items: [mockOrderItem] },
      });
      prisma.orderItem.update.mockResolvedValue({
        ...mockOrderItem,
        status: OrderStatus.SHIPPED,
        trackingNo: 'TRACK123',
      });
      prisma.orderItem.findMany.mockResolvedValue([
        { ...mockOrderItem, status: OrderStatus.PROCESSING },
      ]);
      prisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.SHIPPED,
      });
      prisma.order.findUniqueOrThrow.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.SHIPPED,
        items: [{ ...mockOrder.items[0], status: OrderStatus.SHIPPED, trackingNo: 'TRACK123' }],
      });

      const dto: UpdateOrderItemStatusDto = {
        status: OrderStatus.SHIPPED,
        trackingNo: 'TRACK123',
      };
      const result = await service.updateOrderItemStatus(MOCK_ITEM_ID, dto, MOCK_VENDOR_ID);

      expect(prisma.orderItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ trackingNo: 'TRACK123' }),
        }),
      );
      expect(result).toBeDefined();
    });

    it('should auto-update order status to DELIVERED when all items delivered', async () => {
      prisma.orderItem.findUnique.mockResolvedValue({
        ...mockOrderItem,
        status: OrderStatus.SHIPPED,
        order: { ...mockOrder, status: OrderStatus.SHIPPED, items: [mockOrderItem] },
      });
      prisma.orderItem.update.mockResolvedValue({
        ...mockOrderItem,
        status: OrderStatus.DELIVERED,
      });
      prisma.orderItem.findMany.mockResolvedValue([
        { ...mockOrderItem, status: OrderStatus.SHIPPED },
      ]);
      prisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.DELIVERED,
      });
      prisma.order.findUniqueOrThrow.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.DELIVERED,
      });

      const dto: UpdateOrderItemStatusDto = { status: OrderStatus.DELIVERED };
      await service.updateOrderItemStatus(MOCK_ITEM_ID, dto, MOCK_VENDOR_ID);

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: OrderStatus.DELIVERED }),
        }),
      );
    });

    it('should throw ForbiddenException when vendor does not own the item', async () => {
      prisma.orderItem.findUnique.mockResolvedValue({
        ...mockOrderItem,
        order: { ...mockOrder, items: [mockOrderItem] },
      });

      await expect(
        service.updateOrderItemStatus(
          MOCK_ITEM_ID,
          { status: OrderStatus.PROCESSING },
          'other-vendor',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject invalid item status transition', async () => {
      prisma.orderItem.findUnique.mockResolvedValue({
        ...mockOrderItem,
        status: OrderStatus.PENDING,
        order: { ...mockOrder, items: [mockOrderItem] },
      });

      await expect(
        service.updateOrderItemStatus(
          MOCK_ITEM_ID,
          { status: OrderStatus.DELIVERED },
          MOCK_VENDOR_ID,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent item', async () => {
      prisma.orderItem.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOrderItemStatus(
          'nonexistent',
          { status: OrderStatus.PROCESSING },
          MOCK_VENDOR_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // cancelOrder
  // ---------------------------------------------------------------------------
  describe('cancelOrder', () => {
    it('should cancel a PENDING order and restore stock', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PENDING,
        items: [
          { ...mockOrderItem, variant: mockProduct.variants[0] },
        ],
      });
      prisma.$transaction.mockImplementation(
        async (fn: (tx: typeof prisma) => Promise<typeof mockOrder>) => fn(prisma),
      );
      prisma.productVariant.update.mockResolvedValue({ stock: 105 });
      prisma.orderItem.updateMany.mockResolvedValue({ count: 1 });
      prisma.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
        cancelReason: 'Changed my mind',
      });

      const result = await service.cancelOrder(MOCK_ORDER_ID, MOCK_BUYER_ID, 'Changed my mind');

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: MOCK_VARIANT_ID },
        data: { stock: { increment: 5 } },
      });
    });

    it('should throw ForbiddenException when non-owner tries to cancel', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PENDING,
        items: [mockOrderItem],
      });

      await expect(
        service.cancelOrder(MOCK_ORDER_ID, 'other-buyer', 'reason'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when items are already shipped', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PARTIALLY_SHIPPED,
        items: [
          { ...mockOrderItem, status: OrderStatus.SHIPPED },
        ],
      });

      await expect(
        service.cancelOrder(MOCK_ORDER_ID, MOCK_BUYER_ID, 'reason'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when order is already cancelled', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
        items: [
          { ...mockOrderItem, status: OrderStatus.CANCELLED },
        ],
      });

      await expect(
        service.cancelOrder(MOCK_ORDER_ID, MOCK_BUYER_ID, 'reason'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent order', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.cancelOrder('nonexistent', MOCK_BUYER_ID, 'reason'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // listBuyerOrders
  // ---------------------------------------------------------------------------
  describe('listBuyerOrders', () => {
    it('should return paginated buyer orders', async () => {
      const listOrder = {
        ...mockOrder,
        _count: { items: 2 },
      };
      prisma.order.findMany.mockResolvedValue([listOrder]);
      prisma.order.count.mockResolvedValue(1);

      const result = await service.listBuyerOrders(MOCK_BUYER_ID, {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.data[0]!.itemCount).toBe(2);

      const findCall = prisma.order.findMany.mock.calls[0][0];
      expect(findCall.where.buyerId).toBe(MOCK_BUYER_ID);
    });

    it('should apply status filter', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await service.listBuyerOrders(MOCK_BUYER_ID, {
        page: 1,
        limit: 20,
        status: OrderStatus.PENDING,
      });

      const findCall = prisma.order.findMany.mock.calls[0][0];
      expect(findCall.where.status).toBe(OrderStatus.PENDING);
    });

    it('should apply date range filter', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await service.listBuyerOrders(MOCK_BUYER_ID, {
        page: 1,
        limit: 20,
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
      });

      const findCall = prisma.order.findMany.mock.calls[0][0];
      expect(findCall.where.createdAt).toBeDefined();
    });
  });
});
