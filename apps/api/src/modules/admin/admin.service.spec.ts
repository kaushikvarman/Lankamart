import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DisputeStatus, OrderStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AdminService } from './admin.service';
import { CouponType, CreateCouponDto, CreateDisputeDto, DisputeReason, DisputeResolutionStatus } from './dto';

// ---------------------------------------------------------------------------
// Constants & mock data
// ---------------------------------------------------------------------------

const MOCK_ADMIN_ID = 'admin-001';
const MOCK_USER_ID = 'user-001';
const MOCK_ORDER_ID = 'order-001';
const MOCK_COUPON_ID = 'coupon-001';
const MOCK_DISPUTE_ID = 'dispute-001';

const now = new Date('2026-04-05T12:00:00Z');

const mockCoupon = {
  id: MOCK_COUPON_ID,
  code: 'SUMMER20',
  description: 'Summer sale 20%',
  type: 'percentage',
  value: new Prisma.Decimal(20),
  currency: null,
  minOrderValue: new Prisma.Decimal(50),
  maxDiscount: new Prisma.Decimal(100),
  usageLimit: 1000,
  usageCount: 5,
  perUserLimit: 1,
  vendorId: null,
  categoryId: null,
  startsAt: new Date('2026-03-01'),
  expiresAt: new Date('2026-06-01'),
  isActive: true,
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-01'),
};

const mockOrder = {
  id: MOCK_ORDER_ID,
  orderNumber: 'LM-20260405-0001',
  buyerId: MOCK_USER_ID,
  status: OrderStatus.DELIVERED,
  totalAmount: new Prisma.Decimal(200),
  currency: 'USD',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDispute = {
  id: MOCK_DISPUTE_ID,
  orderId: MOCK_ORDER_ID,
  initiatorId: MOCK_USER_ID,
  reason: 'not_received',
  description: 'I never received my order after 30 days of waiting',
  evidence: JSON.stringify(['https://example.com/evidence1.jpg']),
  status: DisputeStatus.OPEN,
  resolution: null,
  resolvedAt: null,
  resolvedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  order: { id: MOCK_ORDER_ID, orderNumber: 'LM-20260405-0001' },
  initiator: {
    id: MOCK_USER_ID,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  },
};

const mockSetting = {
  id: 'setting-001',
  key: 'platform.commission_rate',
  value: '5.00',
  type: 'number',
  group: 'payment',
  label: 'Platform Commission Rate (%)',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAuditLog = {
  id: 'audit-001',
  userId: MOCK_ADMIN_ID,
  action: 'setting.updated',
  entityType: 'platform_setting',
  entityId: 'platform.commission_rate',
  oldValue: JSON.stringify({ value: '5.00' }),
  newValue: JSON.stringify({ value: '7.00' }),
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
  createdAt: new Date(),
};

// ---------------------------------------------------------------------------
// Mock PrismaService
// ---------------------------------------------------------------------------

const mockPrisma = {
  user: { count: jest.fn() },
  vendorProfile: { count: jest.fn() },
  product: { count: jest.fn(), findMany: jest.fn() },
  order: {
    count: jest.fn(),
    aggregate: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  dispute: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  coupon: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  platformSetting: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
    jest.useFakeTimers({ now });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // =========================================================================
  // DASHBOARD
  // =========================================================================

  describe('getDashboardStats', () => {
    it('should aggregate counts from all tables using Promise.all', async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(20)  // totalVendors
        .mockResolvedValueOnce(75); // totalBuyers
      mockPrisma.product.count
        .mockResolvedValueOnce(500) // totalProducts
        .mockResolvedValueOnce(8);  // pendingProductReviews
      mockPrisma.order.count
        .mockResolvedValueOnce(300) // totalOrders
        .mockResolvedValueOnce(15); // pendingOrders
      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: new Prisma.Decimal(150000) },
      });
      mockPrisma.vendorProfile.count.mockResolvedValue(3); // pendingKyc
      mockPrisma.dispute.count.mockResolvedValue(5); // activeDisputes
      mockPrisma.order.findMany.mockResolvedValue([
        {
          id: 'o1',
          orderNumber: 'LM-0001',
          totalAmount: new Prisma.Decimal(200),
          currency: 'USD',
          status: 'DELIVERED',
          createdAt: new Date(),
          buyer: { firstName: 'John', lastName: 'Doe' },
        },
      ]);
      mockPrisma.product.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: 'Widget',
          slug: 'widget',
          totalSold: 50,
          basePrice: new Prisma.Decimal(29.99),
          baseCurrency: 'USD',
        },
      ]);

      const stats = await service.getDashboardStats();

      expect(stats.totalUsers).toBe(100);
      expect(stats.totalVendors).toBe(20);
      expect(stats.totalBuyers).toBe(75);
      expect(stats.totalProducts).toBe(500);
      expect(stats.totalOrders).toBe(300);
      expect(stats.totalRevenue).toBe(150000);
      expect(stats.pendingOrders).toBe(15);
      expect(stats.pendingKyc).toBe(3);
      expect(stats.pendingProductReviews).toBe(8);
      expect(stats.activeDisputes).toBe(5);
      expect(stats.recentOrders).toHaveLength(1);
      expect(stats.recentOrders[0]!.buyerName).toBe('John Doe');
      expect(stats.topProducts).toHaveLength(1);
      expect(stats.topProducts[0]!.basePrice).toBe(29.99);
    });

    it('should handle zero revenue gracefully', async () => {
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.product.count.mockResolvedValue(0);
      mockPrisma.order.count.mockResolvedValue(0);
      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: null },
      });
      mockPrisma.vendorProfile.count.mockResolvedValue(0);
      mockPrisma.dispute.count.mockResolvedValue(0);
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.product.findMany.mockResolvedValue([]);

      const stats = await service.getDashboardStats();

      expect(stats.totalRevenue).toBe(0);
      expect(stats.recentOrders).toEqual([]);
      expect(stats.topProducts).toEqual([]);
    });
  });

  // =========================================================================
  // COUPON CRUD
  // =========================================================================

  describe('createCoupon', () => {
    it('should create a coupon successfully', async () => {
      mockPrisma.coupon.create.mockResolvedValue(mockCoupon);

      const dto: CreateCouponDto = {
        code: 'SUMMER20',
        type: CouponType.PERCENTAGE,
        value: 20,
        perUserLimit: 1,
        startsAt: '2026-03-01T00:00:00Z',
        expiresAt: '2026-06-01T00:00:00Z',
      };

      const result = await service.createCoupon(dto);

      expect(result.code).toBe('SUMMER20');
      expect(result.value).toBe(20);
      expect(mockPrisma.coupon.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException for duplicate coupon code', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' },
      );
      mockPrisma.coupon.create.mockRejectedValue(prismaError);

      const dto: CreateCouponDto = {
        code: 'SUMMER20',
        type: CouponType.PERCENTAGE,
        value: 20,
        perUserLimit: 1,
        startsAt: '2026-03-01T00:00:00Z',
        expiresAt: '2026-06-01T00:00:00Z',
      };

      await expect(service.createCoupon(dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('validateCoupon', () => {
    it('should validate an active percentage coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);

      const result = await service.validateCoupon(
        'SUMMER20',
        200,
        'USD',
        MOCK_USER_ID,
      );

      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(40); // 20% of 200
      expect(result.couponId).toBe(MOCK_COUPON_ID);
    });

    it('should cap percentage discount at maxDiscount', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);

      // 20% of 1000 = 200, but maxDiscount is 100
      const result = await service.validateCoupon(
        'SUMMER20',
        1000,
        'USD',
        MOCK_USER_ID,
      );

      expect(result.discountAmount).toBe(100);
    });

    it('should reject expired coupon', async () => {
      const expiredCoupon = {
        ...mockCoupon,
        expiresAt: new Date('2026-01-01'),
      };
      mockPrisma.coupon.findUnique.mockResolvedValue(expiredCoupon);

      await expect(
        service.validateCoupon('SUMMER20', 200, 'USD', MOCK_USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject coupon not yet active', async () => {
      const futureCoupon = {
        ...mockCoupon,
        startsAt: new Date('2026-12-01'),
        expiresAt: new Date('2027-01-01'),
      };
      mockPrisma.coupon.findUnique.mockResolvedValue(futureCoupon);

      await expect(
        service.validateCoupon('SUMMER20', 200, 'USD', MOCK_USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject inactive coupon', async () => {
      const inactiveCoupon = { ...mockCoupon, isActive: false };
      mockPrisma.coupon.findUnique.mockResolvedValue(inactiveCoupon);

      await expect(
        service.validateCoupon('SUMMER20', 200, 'USD', MOCK_USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject coupon that exceeded usage limit', async () => {
      const overUsedCoupon = {
        ...mockCoupon,
        usageLimit: 5,
        usageCount: 5,
      };
      mockPrisma.coupon.findUnique.mockResolvedValue(overUsedCoupon);

      await expect(
        service.validateCoupon('SUMMER20', 200, 'USD', MOCK_USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject coupon when order amount is below minimum', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);

      // minOrderValue is 50, order is 30
      await expect(
        service.validateCoupon('SUMMER20', 30, 'USD', MOCK_USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate fixed_amount coupon correctly', async () => {
      const fixedCoupon = {
        ...mockCoupon,
        type: 'fixed_amount',
        value: new Prisma.Decimal(25),
        currency: 'USD',
        maxDiscount: null,
      };
      mockPrisma.coupon.findUnique.mockResolvedValue(fixedCoupon);

      const result = await service.validateCoupon(
        'SUMMER20',
        200,
        'USD',
        MOCK_USER_ID,
      );

      expect(result.discountAmount).toBe(25);
    });

    it('should cap fixed_amount at order total', async () => {
      const fixedCoupon = {
        ...mockCoupon,
        type: 'fixed_amount',
        value: new Prisma.Decimal(500),
        currency: 'USD',
        maxDiscount: null,
        minOrderValue: null,
      };
      mockPrisma.coupon.findUnique.mockResolvedValue(fixedCoupon);

      const result = await service.validateCoupon(
        'SUMMER20',
        200,
        'USD',
        MOCK_USER_ID,
      );

      expect(result.discountAmount).toBe(200);
    });

    it('should reject fixed_amount coupon with wrong currency', async () => {
      const fixedCoupon = {
        ...mockCoupon,
        type: 'fixed_amount',
        currency: 'LKR',
      };
      mockPrisma.coupon.findUnique.mockResolvedValue(fixedCoupon);

      await expect(
        service.validateCoupon('SUMMER20', 200, 'USD', MOCK_USER_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return 0 discount for free_shipping coupon', async () => {
      const freeShipping = {
        ...mockCoupon,
        type: 'free_shipping',
        minOrderValue: null,
      };
      mockPrisma.coupon.findUnique.mockResolvedValue(freeShipping);

      const result = await service.validateCoupon(
        'SUMMER20',
        200,
        'USD',
        MOCK_USER_ID,
      );

      expect(result.discountAmount).toBe(0);
      expect(result.valid).toBe(true);
    });

    it('should throw NotFoundException for non-existent coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);

      await expect(
        service.validateCoupon('NOPE', 200, 'USD', MOCK_USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCoupon', () => {
    it('should update coupon fields', async () => {
      const updated = { ...mockCoupon, description: 'Updated description' };
      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrisma.coupon.update.mockResolvedValue(updated);

      const result = await service.updateCoupon(MOCK_COUPON_ID, {
        description: 'Updated description',
      });

      expect(result.description).toBe('Updated description');
    });

    it('should throw NotFoundException for non-existent coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCoupon('non-existent', { description: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCoupon', () => {
    it('should delete coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockPrisma.coupon.delete.mockResolvedValue(mockCoupon);

      const result = await service.deleteCoupon(MOCK_COUPON_ID);

      expect(result.message).toContain('SUMMER20');
      expect(mockPrisma.coupon.delete).toHaveBeenCalledWith({
        where: { id: MOCK_COUPON_ID },
      });
    });

    it('should throw NotFoundException for non-existent coupon', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);

      await expect(service.deleteCoupon('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // DISPUTES
  // =========================================================================

  describe('createDispute', () => {
    it('should create a dispute for the order owner', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.dispute.findFirst.mockResolvedValue(null);
      mockPrisma.dispute.create.mockResolvedValue(mockDispute);

      const dto: CreateDisputeDto = {
        orderId: MOCK_ORDER_ID,
        reason: DisputeReason.NOT_RECEIVED,
        description: 'I never received my order after 30 days of waiting',
        evidence: ['https://example.com/evidence1.jpg'],
      };

      const result = await service.createDispute(MOCK_USER_ID, dto);

      expect(result.id).toBe(MOCK_DISPUTE_ID);
      expect(result.reason).toBe('not_received');
      expect(result.initiator?.id).toBe(MOCK_USER_ID);
    });

    it('should throw ForbiddenException when user does not own the order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const dto: CreateDisputeDto = {
        orderId: MOCK_ORDER_ID,
        reason: DisputeReason.DAMAGED,
        description: 'Product was damaged when it arrived at my door',
      };

      await expect(
        service.createDispute('other-user', dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when active dispute exists', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.dispute.findFirst.mockResolvedValue(mockDispute);

      const dto: CreateDisputeDto = {
        orderId: MOCK_ORDER_ID,
        reason: DisputeReason.NOT_RECEIVED,
        description: 'I never received my order after 30 days of waiting',
      };

      await expect(
        service.createDispute(MOCK_USER_ID, dto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException for non-existent order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      const dto: CreateDisputeDto = {
        orderId: 'bad-order',
        reason: DisputeReason.WRONG_ITEM,
        description: 'Wrong item was shipped to my address instead of correct',
      };

      await expect(
        service.createDispute(MOCK_USER_ID, dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolveDispute', () => {
    it('should resolve an open dispute', async () => {
      const resolved = {
        ...mockDispute,
        status: DisputeStatus.RESOLVED_BUYER,
        resolution: 'Full refund issued',
        resolvedBy: MOCK_ADMIN_ID,
        resolvedAt: now,
      };
      mockPrisma.dispute.findUnique.mockResolvedValue(mockDispute);
      mockPrisma.dispute.update.mockResolvedValue(resolved);

      const result = await service.resolveDispute(
        MOCK_DISPUTE_ID,
        MOCK_ADMIN_ID,
        {
          resolution: 'Full refund issued',
          status: DisputeResolutionStatus.RESOLVED_BUYER,
        },
      );

      expect(result.status).toBe(DisputeStatus.RESOLVED_BUYER);
      expect(result.resolution).toBe('Full refund issued');
      expect(result.resolvedBy).toBe(MOCK_ADMIN_ID);
    });

    it('should throw BadRequestException when dispute is already resolved', async () => {
      const resolvedDispute = {
        ...mockDispute,
        status: DisputeStatus.RESOLVED_BUYER,
      };
      mockPrisma.dispute.findUnique.mockResolvedValue(resolvedDispute);

      await expect(
        service.resolveDispute(MOCK_DISPUTE_ID, MOCK_ADMIN_ID, {
          resolution: 'Try again',
          status: DisputeResolutionStatus.RESOLVED_VENDOR,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent dispute', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue(null);

      await expect(
        service.resolveDispute('bad-id', MOCK_ADMIN_ID, {
          resolution: 'Resolved',
          status: DisputeResolutionStatus.RESOLVED_BUYER,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('escalateDispute', () => {
    it('should escalate an OPEN dispute', async () => {
      const escalated = {
        ...mockDispute,
        status: DisputeStatus.ESCALATED,
      };
      mockPrisma.dispute.findUnique.mockResolvedValue(mockDispute);
      mockPrisma.dispute.update.mockResolvedValue(escalated);

      const result = await service.escalateDispute(
        MOCK_DISPUTE_ID,
        MOCK_ADMIN_ID,
      );

      expect(result.status).toBe(DisputeStatus.ESCALATED);
    });

    it('should throw BadRequestException for already resolved dispute', async () => {
      const resolvedDispute = {
        ...mockDispute,
        status: DisputeStatus.RESOLVED_BUYER,
      };
      mockPrisma.dispute.findUnique.mockResolvedValue(resolvedDispute);

      await expect(
        service.escalateDispute(MOCK_DISPUTE_ID, MOCK_ADMIN_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent dispute', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue(null);

      await expect(
        service.escalateDispute('bad-id', MOCK_ADMIN_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // AUDIT LOGS
  // =========================================================================

  describe('createAuditLog', () => {
    it('should create an audit log entry', async () => {
      mockPrisma.auditLog.create.mockResolvedValue(mockAuditLog);

      await service.createAuditLog(
        MOCK_ADMIN_ID,
        'setting.updated',
        'platform_setting',
        'platform.commission_rate',
        JSON.stringify({ value: '5.00' }),
        JSON.stringify({ value: '7.00' }),
        '127.0.0.1',
        'test-agent',
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: MOCK_ADMIN_ID,
          action: 'setting.updated',
          entityType: 'platform_setting',
          entityId: 'platform.commission_rate',
          oldValue: JSON.stringify({ value: '5.00' }),
          newValue: JSON.stringify({ value: '7.00' }),
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        },
      });
    });

    it('should accept null userId for system actions', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({
        ...mockAuditLog,
        userId: null,
      });

      await service.createAuditLog(
        null,
        'system.cron',
        'exchange_rate',
        'usd-lkr',
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: null }),
      });
    });
  });

  describe('listAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await service.listAuditLogs({
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.data[0]!.action).toBe('setting.updated');
    });

    it('should filter by userId', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      await service.listAuditLogs({
        page: 1,
        limit: 20,
        userId: MOCK_ADMIN_ID,
      });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: MOCK_ADMIN_ID }),
        }),
      );
    });

    it('should filter by date range', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await service.listAuditLogs({
        page: 1,
        limit: 20,
        dateFrom: '2026-04-01',
        dateTo: '2026-04-05',
      });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date('2026-04-01'),
              lte: new Date('2026-04-05'),
            },
          }),
        }),
      );
    });

    it('should filter by action and entityType', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await service.listAuditLogs({
        page: 1,
        limit: 20,
        action: 'setting.updated',
        entityType: 'platform_setting',
      });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'setting.updated',
            entityType: 'platform_setting',
          }),
        }),
      );
    });
  });

  // =========================================================================
  // SETTINGS
  // =========================================================================

  describe('getSettings', () => {
    it('should return all settings', async () => {
      mockPrisma.platformSetting.findMany.mockResolvedValue([mockSetting]);

      const result = await service.getSettings();

      expect(result).toHaveLength(1);
      expect(result[0]!.key).toBe('platform.commission_rate');
    });

    it('should filter settings by group', async () => {
      mockPrisma.platformSetting.findMany.mockResolvedValue([mockSetting]);

      await service.getSettings('payment');

      expect(mockPrisma.platformSetting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { group: 'payment' },
        }),
      );
    });
  });

  describe('getSetting', () => {
    it('should return a single setting by key', async () => {
      mockPrisma.platformSetting.findUnique.mockResolvedValue(mockSetting);

      const result = await service.getSetting('platform.commission_rate');

      expect(result.key).toBe('platform.commission_rate');
      expect(result.value).toBe('5.00');
    });

    it('should throw NotFoundException for non-existent key', async () => {
      mockPrisma.platformSetting.findUnique.mockResolvedValue(null);

      await expect(service.getSetting('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateSetting', () => {
    it('should update setting and create audit log', async () => {
      const updated = { ...mockSetting, value: '7.00' };
      mockPrisma.platformSetting.findUnique.mockResolvedValue(mockSetting);
      mockPrisma.platformSetting.update.mockResolvedValue(updated);
      mockPrisma.auditLog.create.mockResolvedValue(mockAuditLog);

      const result = await service.updateSetting(
        'platform.commission_rate',
        { value: '7.00' },
        MOCK_ADMIN_ID,
      );

      expect(result.value).toBe('7.00');
      expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'setting.updated',
          entityType: 'platform_setting',
          entityId: 'platform.commission_rate',
          userId: MOCK_ADMIN_ID,
        }),
      });
    });

    it('should throw NotFoundException for non-existent setting', async () => {
      mockPrisma.platformSetting.findUnique.mockResolvedValue(null);

      await expect(
        service.updateSetting('nope', { value: 'x' }, MOCK_ADMIN_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // COUPON LISTING
  // =========================================================================

  describe('listCoupons', () => {
    it('should return paginated coupons', async () => {
      mockPrisma.coupon.findMany.mockResolvedValue([mockCoupon]);
      mockPrisma.coupon.count.mockResolvedValue(1);

      const result = await service.listCoupons({
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.hasNext).toBe(false);
    });

    it('should filter by isActive and type', async () => {
      mockPrisma.coupon.findMany.mockResolvedValue([]);
      mockPrisma.coupon.count.mockResolvedValue(0);

      await service.listCoupons({
        page: 1,
        limit: 20,
        isActive: true,
        type: CouponType.PERCENTAGE,
      });

      expect(mockPrisma.coupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            type: 'percentage',
          }),
        }),
      );
    });
  });

  describe('getCouponByCode', () => {
    it('should return coupon by code', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(mockCoupon);

      const result = await service.getCouponByCode('SUMMER20');

      expect(result.code).toBe('SUMMER20');
    });

    it('should throw NotFoundException for non-existent code', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValue(null);

      await expect(service.getCouponByCode('NOPE')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // DISPUTE LISTING
  // =========================================================================

  describe('listDisputes', () => {
    it('should return paginated disputes', async () => {
      mockPrisma.dispute.findMany.mockResolvedValue([mockDispute]);
      mockPrisma.dispute.count.mockResolvedValue(1);

      const result = await service.listDisputes({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrisma.dispute.findMany.mockResolvedValue([]);
      mockPrisma.dispute.count.mockResolvedValue(0);

      await service.listDisputes({
        page: 1,
        limit: 20,
        status: DisputeStatus.ESCALATED,
      });

      expect(mockPrisma.dispute.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: DisputeStatus.ESCALATED,
          }),
        }),
      );
    });
  });

  describe('listUserDisputes', () => {
    it('should filter disputes by userId', async () => {
      mockPrisma.dispute.findMany.mockResolvedValue([mockDispute]);
      mockPrisma.dispute.count.mockResolvedValue(1);

      const result = await service.listUserDisputes(MOCK_USER_ID, {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(mockPrisma.dispute.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            initiatorId: MOCK_USER_ID,
          }),
        }),
      );
    });
  });

  describe('getDispute', () => {
    it('should return a dispute by ID', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue(mockDispute);

      const result = await service.getDispute(MOCK_DISPUTE_ID);

      expect(result.id).toBe(MOCK_DISPUTE_ID);
      expect(result.orderNumber).toBe('LM-20260405-0001');
    });

    it('should throw NotFoundException for non-existent dispute', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue(null);

      await expect(service.getDispute('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
