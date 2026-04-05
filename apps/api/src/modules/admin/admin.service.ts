import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DisputeStatus, Prisma, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '@/common/prisma/prisma.service';
import { PaginatedResponse } from '@/modules/vendors/vendors.service';
import {
  DashboardStatsDto,
  RecentOrderDto,
  TopProductDto,
  CreateCouponDto,
  CouponType,
  UpdateCouponDto,
  CouponResponseDto,
  QueryCouponsDto,
  CreateDisputeDto,
  ResolveDisputeDto,
  DisputeResponseDto,
  QueryDisputesDto,
  UpdateSettingDto,
  SettingResponseDto,
  QueryAuditLogsDto,
  AuditLogResponseDto,
} from './dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // DASHBOARD
  // ---------------------------------------------------------------------------

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const [
      totalUsers,
      totalVendors,
      totalBuyers,
      totalProducts,
      totalOrders,
      revenueAgg,
      pendingOrders,
      pendingKyc,
      pendingProductReviews,
      activeDisputes,
      recentOrdersRaw,
      topProductsRaw,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({
        where: { role: UserRole.VENDOR, deletedAt: null },
      }),
      this.prisma.user.count({
        where: { role: UserRole.BUYER, deletedAt: null },
      }),
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { totalAmount: true } }),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.vendorProfile.count({
        where: { kycStatus: 'PENDING_REVIEW' },
      }),
      this.prisma.product.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.dispute.count({
        where: {
          status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
        },
      }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.product.findMany({
        where: { deletedAt: null, status: 'ACTIVE' },
        take: 5,
        orderBy: { totalSold: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          totalSold: true,
          basePrice: true,
          baseCurrency: true,
        },
      }),
    ]);

    const totalRevenue =
      revenueAgg._sum.totalAmount instanceof Decimal
        ? revenueAgg._sum.totalAmount.toNumber()
        : Number(revenueAgg._sum.totalAmount ?? 0);

    const recentOrders: RecentOrderDto[] = recentOrdersRaw.map((order) => {
      const dto = new RecentOrderDto();
      dto.id = order.id;
      dto.orderNumber = order.orderNumber;
      dto.buyerName = `${order.buyer.firstName} ${order.buyer.lastName}`;
      dto.totalAmount =
        order.totalAmount instanceof Decimal
          ? order.totalAmount.toNumber()
          : Number(order.totalAmount);
      dto.currency = order.currency;
      dto.status = order.status;
      dto.createdAt = order.createdAt;
      return dto;
    });

    const topProducts: TopProductDto[] = topProductsRaw.map((product) => {
      const dto = new TopProductDto();
      dto.id = product.id;
      dto.name = product.name;
      dto.slug = product.slug;
      dto.totalSold = product.totalSold;
      dto.basePrice =
        product.basePrice instanceof Decimal
          ? product.basePrice.toNumber()
          : Number(product.basePrice);
      dto.baseCurrency = product.baseCurrency;
      return dto;
    });

    const stats = new DashboardStatsDto();
    stats.totalUsers = totalUsers;
    stats.totalVendors = totalVendors;
    stats.totalBuyers = totalBuyers;
    stats.totalProducts = totalProducts;
    stats.totalOrders = totalOrders;
    stats.totalRevenue = totalRevenue;
    stats.pendingOrders = pendingOrders;
    stats.pendingKyc = pendingKyc;
    stats.pendingProductReviews = pendingProductReviews;
    stats.activeDisputes = activeDisputes;
    stats.recentOrders = recentOrders;
    stats.topProducts = topProducts;

    return stats;
  }

  // ---------------------------------------------------------------------------
  // COUPONS
  // ---------------------------------------------------------------------------

  async createCoupon(dto: CreateCouponDto): Promise<CouponResponseDto> {
    try {
      const coupon = await this.prisma.coupon.create({
        data: {
          code: dto.code,
          description: dto.description,
          type: dto.type,
          value: new Decimal(dto.value),
          currency: dto.currency,
          minOrderValue: dto.minOrderValue
            ? new Decimal(dto.minOrderValue)
            : undefined,
          maxDiscount: dto.maxDiscount
            ? new Decimal(dto.maxDiscount)
            : undefined,
          usageLimit: dto.usageLimit,
          perUserLimit: dto.perUserLimit,
          vendorId: dto.vendorId,
          categoryId: dto.categoryId,
          startsAt: new Date(dto.startsAt),
          expiresAt: new Date(dto.expiresAt),
        },
      });

      this.logger.log(`Coupon created: ${coupon.code} (${coupon.id})`);
      return CouponResponseDto.fromEntity(coupon);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`Coupon code "${dto.code}" already exists`);
      }
      throw error;
    }
  }

  async getCouponByCode(code: string): Promise<CouponResponseDto> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with code "${code}" not found`);
    }

    return CouponResponseDto.fromEntity(coupon);
  }

  async listCoupons(
    query: QueryCouponsDto,
  ): Promise<PaginatedResponse<CouponResponseDto>> {
    const { page, limit, isActive, type, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CouponWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(type && { type }),
      ...(search && {
        code: { contains: search.toUpperCase(), mode: 'insensitive' as const },
      }),
    };

    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.coupon.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: coupons.map((c) => CouponResponseDto.fromEntity(c)),
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

  async updateCoupon(
    couponId: string,
    dto: UpdateCouponDto,
  ): Promise<CouponResponseDto> {
    const existing = await this.prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!existing) {
      throw new NotFoundException(`Coupon with ID "${couponId}" not found`);
    }

    const updateData: Prisma.CouponUpdateInput = {};

    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.value !== undefined) updateData.value = new Decimal(dto.value);
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.minOrderValue !== undefined) {
      updateData.minOrderValue = new Decimal(dto.minOrderValue);
    }
    if (dto.maxDiscount !== undefined) {
      updateData.maxDiscount = new Decimal(dto.maxDiscount);
    }
    if (dto.usageLimit !== undefined) updateData.usageLimit = dto.usageLimit;
    if (dto.perUserLimit !== undefined) updateData.perUserLimit = dto.perUserLimit;
    if (dto.vendorId !== undefined) updateData.vendorId = dto.vendorId;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.startsAt !== undefined) {
      updateData.startsAt = new Date(dto.startsAt);
    }
    if (dto.expiresAt !== undefined) {
      updateData.expiresAt = new Date(dto.expiresAt);
    }

    const updated = await this.prisma.coupon.update({
      where: { id: couponId },
      data: updateData,
    });

    this.logger.log(`Coupon updated: ${updated.code} (${updated.id})`);
    return CouponResponseDto.fromEntity(updated);
  }

  async deleteCoupon(couponId: string): Promise<{ message: string }> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID "${couponId}" not found`);
    }

    await this.prisma.coupon.delete({ where: { id: couponId } });

    this.logger.log(`Coupon deleted: ${coupon.code} (${couponId})`);
    return { message: `Coupon "${coupon.code}" has been deleted` };
  }

  async validateCoupon(
    code: string,
    orderAmount: number,
    currency: string,
    userId: string,
  ): Promise<{ valid: boolean; discountAmount: number; couponId: string }> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon "${code}" not found`);
    }

    if (!coupon.isActive) {
      throw new BadRequestException('This coupon is no longer active');
    }

    const now = new Date();

    if (now < coupon.startsAt) {
      throw new BadRequestException('This coupon is not yet active');
    }

    if (now > coupon.expiresAt) {
      throw new BadRequestException('This coupon has expired');
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException(
        'This coupon has reached its total usage limit',
      );
    }

    if (
      coupon.type === CouponType.FIXED_AMOUNT &&
      coupon.currency &&
      coupon.currency !== currency
    ) {
      throw new BadRequestException(
        `This coupon is only valid for ${coupon.currency} orders`,
      );
    }

    const minOrder = coupon.minOrderValue instanceof Decimal
      ? coupon.minOrderValue.toNumber()
      : Number(coupon.minOrderValue ?? 0);

    if (minOrder > 0 && orderAmount < minOrder) {
      throw new BadRequestException(
        `Minimum order value of ${minOrder} is required for this coupon`,
      );
    }

    // Check per-user limit by counting how many orders this user has made with
    // a matching coupon code in the discount metadata. For MVP, we track usage
    // globally. A full implementation would store CouponUsage records.
    // For now, we rely on the global usageCount and perUserLimit as a
    // placeholder — the orders module would need to record per-user usage.

    let discountAmount = 0;
    const couponValue = coupon.value instanceof Decimal
      ? coupon.value.toNumber()
      : Number(coupon.value);

    switch (coupon.type) {
      case CouponType.PERCENTAGE: {
        discountAmount = (orderAmount * couponValue) / 100;
        const maxDiscount = coupon.maxDiscount instanceof Decimal
          ? coupon.maxDiscount.toNumber()
          : Number(coupon.maxDiscount ?? 0);
        if (maxDiscount > 0 && discountAmount > maxDiscount) {
          discountAmount = maxDiscount;
        }
        break;
      }
      case CouponType.FIXED_AMOUNT: {
        discountAmount = couponValue;
        if (discountAmount > orderAmount) {
          discountAmount = orderAmount;
        }
        break;
      }
      case CouponType.FREE_SHIPPING: {
        discountAmount = 0;
        break;
      }
    }

    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      valid: true,
      discountAmount,
      couponId: coupon.id,
    };
  }

  // ---------------------------------------------------------------------------
  // DISPUTES
  // ---------------------------------------------------------------------------

  async createDispute(
    userId: string,
    dto: CreateDisputeDto,
  ): Promise<DisputeResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${dto.orderId}" not found`);
    }

    if (order.buyerId !== userId) {
      throw new ForbiddenException('You can only create disputes for your own orders');
    }

    const existingDispute = await this.prisma.dispute.findFirst({
      where: {
        orderId: dto.orderId,
        initiatorId: userId,
        status: {
          in: [
            DisputeStatus.OPEN,
            DisputeStatus.UNDER_REVIEW,
            DisputeStatus.ESCALATED,
          ],
        },
      },
    });

    if (existingDispute) {
      throw new ConflictException(
        'An active dispute already exists for this order',
      );
    }

    const dispute = await this.prisma.dispute.create({
      data: {
        orderId: dto.orderId,
        initiatorId: userId,
        reason: dto.reason,
        description: dto.description,
        evidence: dto.evidence ? JSON.stringify(dto.evidence) : undefined,
      },
      include: {
        order: { select: { id: true, orderNumber: true } },
        initiator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    this.logger.log(
      `Dispute created: ${dispute.id} for order ${order.orderNumber} by user ${userId}`,
    );

    return DisputeResponseDto.fromEntity(dispute);
  }

  async getDispute(disputeId: string): Promise<DisputeResponseDto> {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: { select: { id: true, orderNumber: true } },
        initiator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute with ID "${disputeId}" not found`);
    }

    return DisputeResponseDto.fromEntity(dispute);
  }

  async listDisputes(
    query: QueryDisputesDto,
  ): Promise<PaginatedResponse<DisputeResponseDto>> {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DisputeWhereInput = {
      ...(status && { status }),
    };

    const [disputes, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { id: true, orderNumber: true } },
          initiator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.dispute.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: disputes.map((d) => DisputeResponseDto.fromEntity(d)),
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

  async listUserDisputes(
    userId: string,
    query: QueryDisputesDto,
  ): Promise<PaginatedResponse<DisputeResponseDto>> {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DisputeWhereInput = {
      initiatorId: userId,
      ...(status && { status }),
    };

    const [disputes, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { id: true, orderNumber: true } },
          initiator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.dispute.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: disputes.map((d) => DisputeResponseDto.fromEntity(d)),
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

  async resolveDispute(
    disputeId: string,
    adminId: string,
    dto: ResolveDisputeDto,
  ): Promise<DisputeResponseDto> {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute with ID "${disputeId}" not found`);
    }

    if (
      dispute.status === DisputeStatus.RESOLVED_BUYER ||
      dispute.status === DisputeStatus.RESOLVED_VENDOR ||
      dispute.status === DisputeStatus.CLOSED
    ) {
      throw new BadRequestException('This dispute has already been resolved');
    }

    const updated = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: dto.status as unknown as DisputeStatus,
        resolution: dto.resolution,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
      include: {
        order: { select: { id: true, orderNumber: true } },
        initiator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    this.logger.log(
      `Dispute ${disputeId} resolved by admin ${adminId}: ${dto.status}`,
    );

    return DisputeResponseDto.fromEntity(updated);
  }

  async escalateDispute(
    disputeId: string,
    adminId: string,
  ): Promise<DisputeResponseDto> {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute with ID "${disputeId}" not found`);
    }

    if (dispute.status !== DisputeStatus.OPEN && dispute.status !== DisputeStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        'Only OPEN or UNDER_REVIEW disputes can be escalated',
      );
    }

    const updated = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: { status: DisputeStatus.ESCALATED },
      include: {
        order: { select: { id: true, orderNumber: true } },
        initiator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    this.logger.log(`Dispute ${disputeId} escalated by admin ${adminId}`);

    return DisputeResponseDto.fromEntity(updated);
  }

  // ---------------------------------------------------------------------------
  // PLATFORM SETTINGS
  // ---------------------------------------------------------------------------

  async getSettings(group?: string): Promise<SettingResponseDto[]> {
    const where: Prisma.PlatformSettingWhereInput = {
      ...(group && { group }),
    };

    const settings = await this.prisma.platformSetting.findMany({
      where,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });

    return settings.map((s) => SettingResponseDto.fromEntity(s));
  }

  async getSetting(key: string): Promise<SettingResponseDto> {
    const setting = await this.prisma.platformSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    return SettingResponseDto.fromEntity(setting);
  }

  async updateSetting(
    key: string,
    dto: UpdateSettingDto,
    adminId: string,
  ): Promise<SettingResponseDto> {
    const setting = await this.prisma.platformSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    const oldValue = setting.value;

    const updated = await this.prisma.platformSetting.update({
      where: { key },
      data: { value: dto.value },
    });

    await this.createAuditLog(
      adminId,
      'setting.updated',
      'platform_setting',
      key,
      JSON.stringify({ value: oldValue }),
      JSON.stringify({ value: dto.value }),
    );

    this.logger.log(`Setting updated: ${key} by admin ${adminId}`);

    return SettingResponseDto.fromEntity(updated);
  }

  // ---------------------------------------------------------------------------
  // AUDIT LOGS
  // ---------------------------------------------------------------------------

  async createAuditLog(
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    oldValue?: string,
    newValue?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldValue,
        newValue,
        ipAddress,
        userAgent,
      },
    });

    this.logger.debug(
      `Audit log: ${action} on ${entityType}:${entityId} by ${userId ?? 'system'}`,
    );
  }

  async listAuditLogs(
    query: QueryAuditLogsDto,
  ): Promise<PaginatedResponse<AuditLogResponseDto>> {
    const { page, limit, userId, action, entityType, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      ...(userId && { userId }),
      ...(action && { action }),
      ...(entityType && { entityType }),
      ...((dateFrom || dateTo) && {
        createdAt: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        },
      }),
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: logs.map((l) => AuditLogResponseDto.fromEntity(l)),
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
}
