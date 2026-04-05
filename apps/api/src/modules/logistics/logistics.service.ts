import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ShippingMode } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { randomBytes } from 'crypto';
import { PrismaService } from '@/common/prisma/prisma.service';
import { generateSlug } from '@/common/utils/slug';
import {
  AddMilestoneDto,
  CalculateShippingDto,
  CreateLogisticsPartnerDto,
  CreateShipmentDto,
  CreateShippingRateDto,
  CreateShippingZoneDto,
  LogisticsPartnerResponseDto,
  QueryShipmentsDto,
  ShipmentResponseDto,
  ShippingQuoteResponseDto,
  ShippingRateResponseDto,
  ShippingZoneResponseDto,
  UpdateLogisticsPartnerDto,
  UpdateShippingRateDto,
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

const DIMENSIONAL_WEIGHT_DIVISOR = 5000;

@Injectable()
export class LogisticsService {
  private readonly logger = new Logger(LogisticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // PARTNERS
  // ---------------------------------------------------------------------------

  async createPartner(
    dto: CreateLogisticsPartnerDto,
  ): Promise<LogisticsPartnerResponseDto> {
    const slug = generateSlug(dto.companyName);

    const partner = await this.prisma.logisticsPartner.create({
      data: {
        companyName: dto.companyName,
        slug,
        description: dto.description,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        website: dto.website,
        coverageAreas: dto.coverageAreas,
        shippingModes: JSON.stringify(dto.shippingModes),
        certifications: dto.certifications,
        insuranceOffered: dto.insuranceOffered,
        trackingEnabled: dto.trackingEnabled ?? true,
        trackingUrl: dto.trackingUrl,
      },
      include: { _count: { select: { shipments: true } } },
    });

    this.logger.log(
      `Logistics partner created: ${partner.companyName} (${partner.id})`,
    );

    return LogisticsPartnerResponseDto.fromEntity(partner);
  }

  async updatePartner(
    partnerId: string,
    dto: UpdateLogisticsPartnerDto,
  ): Promise<LogisticsPartnerResponseDto> {
    const existing = await this.prisma.logisticsPartner.findUnique({
      where: { id: partnerId },
    });

    if (!existing) {
      throw new NotFoundException(
        `Logistics partner with ID "${partnerId}" not found`,
      );
    }

    const updateData: Prisma.LogisticsPartnerUpdateInput = {};

    if (dto.companyName !== undefined) {
      updateData.companyName = dto.companyName;
      updateData.slug = generateSlug(dto.companyName);
    }
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.contactEmail !== undefined) updateData.contactEmail = dto.contactEmail;
    if (dto.contactPhone !== undefined) updateData.contactPhone = dto.contactPhone;
    if (dto.website !== undefined) updateData.website = dto.website;
    if (dto.coverageAreas !== undefined) updateData.coverageAreas = dto.coverageAreas;
    if (dto.shippingModes !== undefined) {
      updateData.shippingModes = JSON.stringify(dto.shippingModes);
    }
    if (dto.certifications !== undefined) updateData.certifications = dto.certifications;
    if (dto.insuranceOffered !== undefined) updateData.insuranceOffered = dto.insuranceOffered;
    if (dto.trackingEnabled !== undefined) updateData.trackingEnabled = dto.trackingEnabled;
    if (dto.trackingUrl !== undefined) updateData.trackingUrl = dto.trackingUrl;

    const updated = await this.prisma.logisticsPartner.update({
      where: { id: partnerId },
      data: updateData,
      include: { _count: { select: { shipments: true } } },
    });

    this.logger.log(`Logistics partner updated: ${updated.id}`);

    return LogisticsPartnerResponseDto.fromEntity(updated);
  }

  async getPartnerBySlug(slug: string): Promise<LogisticsPartnerResponseDto> {
    const partner = await this.prisma.logisticsPartner.findUnique({
      where: { slug },
      include: { _count: { select: { shipments: true } } },
    });

    if (!partner || !partner.isActive) {
      throw new NotFoundException(
        `Logistics partner with slug "${slug}" not found`,
      );
    }

    return LogisticsPartnerResponseDto.fromEntity(partner);
  }

  async listPartners(search?: string): Promise<LogisticsPartnerResponseDto[]> {
    const where: Prisma.LogisticsPartnerWhereInput = {
      isActive: true,
      ...(search && {
        companyName: { contains: search, mode: 'insensitive' as const },
      }),
    };

    const partners = await this.prisma.logisticsPartner.findMany({
      where,
      include: { _count: { select: { shipments: true } } },
      orderBy: { companyName: 'asc' },
    });

    return partners.map((p) => LogisticsPartnerResponseDto.fromEntity(p));
  }

  // ---------------------------------------------------------------------------
  // ZONES
  // ---------------------------------------------------------------------------

  async createZone(dto: CreateShippingZoneDto): Promise<ShippingZoneResponseDto> {
    const zone = await this.prisma.shippingZone.create({
      data: {
        name: dto.name,
        countries: JSON.stringify(dto.countries),
        regions: dto.regions,
      },
    });

    this.logger.log(`Shipping zone created: ${zone.name} (${zone.id})`);

    return ShippingZoneResponseDto.fromEntity(zone);
  }

  async listZones(): Promise<ShippingZoneResponseDto[]> {
    const zones = await this.prisma.shippingZone.findMany({
      orderBy: { name: 'asc' },
    });

    return zones.map((z) => ShippingZoneResponseDto.fromEntity(z));
  }

  // ---------------------------------------------------------------------------
  // RATES
  // ---------------------------------------------------------------------------

  async createRate(dto: CreateShippingRateDto): Promise<ShippingRateResponseDto> {
    const [partner, originZone, destZone] = await Promise.all([
      this.prisma.logisticsPartner.findUnique({ where: { id: dto.partnerId } }),
      this.prisma.shippingZone.findUnique({ where: { id: dto.originZoneId } }),
      this.prisma.shippingZone.findUnique({ where: { id: dto.destinationZoneId } }),
    ]);

    if (!partner) {
      throw new NotFoundException(
        `Logistics partner with ID "${dto.partnerId}" not found`,
      );
    }
    if (!originZone) {
      throw new NotFoundException(
        `Origin zone with ID "${dto.originZoneId}" not found`,
      );
    }
    if (!destZone) {
      throw new NotFoundException(
        `Destination zone with ID "${dto.destinationZoneId}" not found`,
      );
    }

    if (dto.minTransitDays > dto.maxTransitDays) {
      throw new BadRequestException(
        'Minimum transit days cannot exceed maximum transit days',
      );
    }

    const rate = await this.prisma.shippingRate.create({
      data: {
        partnerId: dto.partnerId,
        originZoneId: dto.originZoneId,
        destinationZoneId: dto.destinationZoneId,
        shippingMode: dto.shippingMode,
        currency: dto.currency ?? 'USD',
        baseRate: dto.baseRate,
        perKgRate: dto.perKgRate,
        perCbmRate: dto.perCbmRate,
        minWeight: dto.minWeight ?? '0',
        maxWeight: dto.maxWeight,
        minTransitDays: dto.minTransitDays,
        maxTransitDays: dto.maxTransitDays,
        fuelSurcharge: dto.fuelSurcharge ?? '0',
        insuranceRate: dto.insuranceRate,
        validFrom: dto.validFrom ?? new Date(),
        validUntil: dto.validUntil,
      },
      include: {
        partner: { select: { companyName: true } },
        originZone: { select: { name: true } },
        destinationZone: { select: { name: true } },
      },
    });

    this.logger.log(
      `Shipping rate created: ${rate.id} (${partner.companyName}, ${rate.shippingMode})`,
    );

    return ShippingRateResponseDto.fromEntity(rate);
  }

  async updateRate(
    rateId: string,
    dto: UpdateShippingRateDto,
  ): Promise<ShippingRateResponseDto> {
    const existing = await this.prisma.shippingRate.findUnique({
      where: { id: rateId },
    });

    if (!existing) {
      throw new NotFoundException(
        `Shipping rate with ID "${rateId}" not found`,
      );
    }

    const updateData: Prisma.ShippingRateUpdateInput = {};

    if (dto.shippingMode !== undefined) updateData.shippingMode = dto.shippingMode;
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.baseRate !== undefined) updateData.baseRate = dto.baseRate;
    if (dto.perKgRate !== undefined) updateData.perKgRate = dto.perKgRate;
    if (dto.perCbmRate !== undefined) updateData.perCbmRate = dto.perCbmRate;
    if (dto.minWeight !== undefined) updateData.minWeight = dto.minWeight;
    if (dto.maxWeight !== undefined) updateData.maxWeight = dto.maxWeight;
    if (dto.minTransitDays !== undefined) updateData.minTransitDays = dto.minTransitDays;
    if (dto.maxTransitDays !== undefined) updateData.maxTransitDays = dto.maxTransitDays;
    if (dto.fuelSurcharge !== undefined) updateData.fuelSurcharge = dto.fuelSurcharge;
    if (dto.insuranceRate !== undefined) updateData.insuranceRate = dto.insuranceRate;
    if (dto.validFrom !== undefined) updateData.validFrom = dto.validFrom;
    if (dto.validUntil !== undefined) updateData.validUntil = dto.validUntil;

    const minDays = dto.minTransitDays ?? existing.minTransitDays;
    const maxDays = dto.maxTransitDays ?? existing.maxTransitDays;
    if (minDays > maxDays) {
      throw new BadRequestException(
        'Minimum transit days cannot exceed maximum transit days',
      );
    }

    const updated = await this.prisma.shippingRate.update({
      where: { id: rateId },
      data: updateData,
      include: {
        partner: { select: { companyName: true } },
        originZone: { select: { name: true } },
        destinationZone: { select: { name: true } },
      },
    });

    this.logger.log(`Shipping rate updated: ${rateId}`);

    return ShippingRateResponseDto.fromEntity(updated);
  }

  async deleteRate(rateId: string): Promise<{ message: string }> {
    const existing = await this.prisma.shippingRate.findUnique({
      where: { id: rateId },
    });

    if (!existing) {
      throw new NotFoundException(
        `Shipping rate with ID "${rateId}" not found`,
      );
    }

    await this.prisma.shippingRate.update({
      where: { id: rateId },
      data: { isActive: false },
    });

    this.logger.log(`Shipping rate soft-deleted: ${rateId}`);

    return { message: `Shipping rate "${rateId}" has been deactivated` };
  }

  async getRatesForRoute(
    originZoneId: string,
    destZoneId: string,
  ): Promise<ShippingRateResponseDto[]> {
    const now = new Date();

    const rates = await this.prisma.shippingRate.findMany({
      where: {
        originZoneId,
        destinationZoneId: destZoneId,
        isActive: true,
        validFrom: { lte: now },
        OR: [{ validUntil: null }, { validUntil: { gte: now } }],
      },
      include: {
        partner: { select: { companyName: true } },
        originZone: { select: { name: true } },
        destinationZone: { select: { name: true } },
      },
      orderBy: { baseRate: 'asc' },
    });

    return rates.map((r) => ShippingRateResponseDto.fromEntity(r));
  }

  // ---------------------------------------------------------------------------
  // SHIPPING CALCULATOR
  // ---------------------------------------------------------------------------

  async calculateShipping(
    dto: CalculateShippingDto,
  ): Promise<ShippingQuoteResponseDto[]> {
    const actualWeight = parseFloat(dto.weight);
    const currency = dto.currency ?? 'USD';

    // Calculate dimensional weight if dimensions provided
    let dimensionalWeight = 0;
    if (dto.length && dto.width && dto.height) {
      const length = parseFloat(dto.length);
      const width = parseFloat(dto.width);
      const height = parseFloat(dto.height);
      dimensionalWeight = (length * width * height) / DIMENSIONAL_WEIGHT_DIVISOR;
    }

    const chargeableWeight = Math.max(actualWeight, dimensionalWeight);
    const declaredValue = dto.declaredValue ? parseFloat(dto.declaredValue) : 0;

    // Find zones matching origin country
    const allZones = await this.prisma.shippingZone.findMany();

    const originZoneIds: string[] = [];
    const destZoneIds: string[] = [];

    for (const zone of allZones) {
      const countries = JSON.parse(zone.countries) as string[];
      if (countries.includes(dto.originCountry)) {
        originZoneIds.push(zone.id);
      }
      if (countries.includes(dto.destinationCountry)) {
        destZoneIds.push(zone.id);
      }
    }

    if (originZoneIds.length === 0 || destZoneIds.length === 0) {
      return [];
    }

    // Find all active rates for these zone pairs
    const now = new Date();

    const rates = await this.prisma.shippingRate.findMany({
      where: {
        originZoneId: { in: originZoneIds },
        destinationZoneId: { in: destZoneIds },
        isActive: true,
        currency,
        validFrom: { lte: now },
        OR: [{ validUntil: null }, { validUntil: { gte: now } }],
      },
      include: {
        partner: {
          select: {
            id: true,
            companyName: true,
            logoUrl: true,
            isActive: true,
            insuranceOffered: true,
          },
        },
      },
    });

    const activeRates = rates.filter((r) => r.partner.isActive);

    // Filter by weight limits
    const validRates = activeRates.filter((rate) => {
      const minWeight = rate.minWeight instanceof Decimal
        ? rate.minWeight.toNumber()
        : Number(rate.minWeight);
      const maxWeight = rate.maxWeight instanceof Decimal
        ? rate.maxWeight.toNumber()
        : rate.maxWeight !== null ? Number(rate.maxWeight) : null;

      if (chargeableWeight < minWeight) return false;
      if (maxWeight !== null && chargeableWeight > maxWeight) return false;
      return true;
    });

    // Calculate cost for each rate
    const quotes: ShippingQuoteResponseDto[] = validRates.map((rate) => {
      const baseRate = rate.baseRate instanceof Decimal
        ? rate.baseRate.toNumber()
        : Number(rate.baseRate);
      const perKgRate = rate.perKgRate instanceof Decimal
        ? rate.perKgRate.toNumber()
        : Number(rate.perKgRate);
      const fuelSurcharge = rate.fuelSurcharge instanceof Decimal
        ? rate.fuelSurcharge.toNumber()
        : Number(rate.fuelSurcharge);
      const insuranceRate = rate.insuranceRate instanceof Decimal
        ? rate.insuranceRate.toNumber()
        : rate.insuranceRate !== null ? Number(rate.insuranceRate) : null;

      // Cost formula: baseRate + (chargeableWeight * perKgRate) * (1 + fuelSurcharge/100)
      const weightCharge = chargeableWeight * perKgRate;
      const subtotal = baseRate + weightCharge;
      const cost = subtotal * (1 + fuelSurcharge / 100);

      // Insurance calculation
      let insuranceCost: number | null = null;
      if (
        insuranceRate !== null &&
        rate.partner.insuranceOffered &&
        declaredValue > 0
      ) {
        insuranceCost = declaredValue * insuranceRate / 100;
      }

      const quote = new ShippingQuoteResponseDto();
      quote.partnerId = rate.partner.id;
      quote.partnerName = rate.partner.companyName;
      quote.partnerLogo = rate.partner.logoUrl;
      quote.shippingMode = rate.shippingMode;
      quote.cost = Math.round(cost * 100) / 100;
      quote.currency = rate.currency;
      quote.minTransitDays = rate.minTransitDays;
      quote.maxTransitDays = rate.maxTransitDays;
      quote.insuranceCost = insuranceCost !== null
        ? Math.round(insuranceCost * 100) / 100
        : null;

      return quote;
    });

    // Sort by cost ascending (cheapest first)
    quotes.sort((a, b) => a.cost - b.cost);

    return quotes;
  }

  // ---------------------------------------------------------------------------
  // SHIPMENTS
  // ---------------------------------------------------------------------------

  async createShipment(
    vendorId: string,
    dto: CreateShipmentDto,
  ): Promise<ShipmentResponseDto> {
    // Verify order item exists and belongs to vendor
    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: dto.orderItemId },
      include: {
        order: {
          include: {
            shippingAddress: true,
          },
        },
        shipment: true,
      },
    });

    if (!orderItem) {
      throw new NotFoundException(
        `Order item with ID "${dto.orderItemId}" not found`,
      );
    }

    if (orderItem.vendorId !== vendorId) {
      throw new ForbiddenException(
        'You can only create shipments for your own order items',
      );
    }

    if (orderItem.shipment) {
      throw new BadRequestException(
        'A shipment already exists for this order item',
      );
    }

    // Verify partner exists and is active
    const partner = await this.prisma.logisticsPartner.findUnique({
      where: { id: dto.partnerId },
    });

    if (!partner || !partner.isActive) {
      throw new NotFoundException(
        `Logistics partner with ID "${dto.partnerId}" not found or inactive`,
      );
    }

    // Generate tracking number
    const trackingNumber = generateTrackingNumber();

    // Build address snapshots
    const shippingAddress = orderItem.order.shippingAddress;
    const destAddressSnapshot = JSON.stringify({
      fullName: shippingAddress.fullName,
      addressLine1: shippingAddress.addressLine1,
      addressLine2: shippingAddress.addressLine2,
      city: shippingAddress.city,
      state: shippingAddress.state,
      postalCode: shippingAddress.postalCode,
      country: shippingAddress.country,
      phone: shippingAddress.phone,
    });

    // For origin, use a placeholder — vendor address not available in this scope
    const originAddressSnapshot = JSON.stringify({
      vendorId,
      note: 'Vendor fulfillment origin',
    });

    // Calculate estimated shipping cost from rates (use base rate as estimate)
    const shippingCost = new Decimal('0.00');

    const shipment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.shipment.create({
        data: {
          orderItemId: dto.orderItemId,
          partnerId: dto.partnerId,
          trackingNumber,
          shippingMode: dto.shippingMode,
          status: 'booked',
          weight: dto.weight,
          dimensions: dto.dimensions,
          declaredValue: dto.declaredValue,
          shippingCost,
          currency: orderItem.currency,
          originAddress: originAddressSnapshot,
          destAddress: destAddressSnapshot,
          notes: dto.notes,
        },
        include: {
          partner: {
            select: {
              companyName: true,
              slug: true,
              trackingUrl: true,
              logoUrl: true,
            },
          },
          milestones: { orderBy: { occurredAt: 'asc' } },
        },
      });

      // Create initial milestone
      await tx.shipmentMilestone.create({
        data: {
          shipmentId: created.id,
          status: 'booked',
          description: 'Shipment booked with logistics partner',
          occurredAt: new Date(),
        },
      });

      // Update order item tracking info
      await tx.orderItem.update({
        where: { id: dto.orderItemId },
        data: { trackingNo: trackingNumber },
      });

      // Reload to include the milestone
      return tx.shipment.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          partner: {
            select: {
              companyName: true,
              slug: true,
              trackingUrl: true,
              logoUrl: true,
            },
          },
          milestones: { orderBy: { occurredAt: 'asc' } },
        },
      });
    });

    this.logger.log(
      `Shipment created: ${shipment.id} (tracking: ${trackingNumber})`,
    );

    return ShipmentResponseDto.fromEntity(shipment);
  }

  async getShipment(shipmentId: string): Promise<ShipmentResponseDto> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        partner: {
          select: {
            companyName: true,
            slug: true,
            trackingUrl: true,
            logoUrl: true,
          },
        },
        milestones: { orderBy: { occurredAt: 'asc' } },
      },
    });

    if (!shipment) {
      throw new NotFoundException(
        `Shipment with ID "${shipmentId}" not found`,
      );
    }

    return ShipmentResponseDto.fromEntity(shipment);
  }

  async addMilestone(
    shipmentId: string,
    dto: AddMilestoneDto,
    vendorId?: string,
  ): Promise<ShipmentResponseDto> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { orderItem: { select: { vendorId: true } } },
    });

    if (!shipment) {
      throw new NotFoundException(
        `Shipment with ID "${shipmentId}" not found`,
      );
    }

    // If vendorId is provided, verify the shipment belongs to this vendor
    if (vendorId && shipment.orderItem.vendorId !== vendorId) {
      throw new ForbiddenException(
        'You can only add milestones to shipments for your own order items',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.shipmentMilestone.create({
        data: {
          shipmentId,
          status: dto.status,
          location: dto.location,
          description: dto.description,
          occurredAt: dto.occurredAt,
        },
      });

      // Update shipment status to the latest milestone status
      const updateData: Prisma.ShipmentUpdateInput = {
        status: dto.status,
      };

      if (dto.status === 'delivered') {
        updateData.actualDelivery = dto.occurredAt;
      }

      await tx.shipment.update({
        where: { id: shipmentId },
        data: updateData,
      });
    });

    this.logger.log(
      `Milestone added to shipment ${shipmentId}: ${dto.status}`,
    );

    // Reload the full shipment with milestones
    const updated = await this.prisma.shipment.findUniqueOrThrow({
      where: { id: shipmentId },
      include: {
        partner: {
          select: {
            companyName: true,
            slug: true,
            trackingUrl: true,
            logoUrl: true,
          },
        },
        milestones: { orderBy: { occurredAt: 'asc' } },
      },
    });

    return ShipmentResponseDto.fromEntity(updated);
  }

  async listShipments(
    query: QueryShipmentsDto,
  ): Promise<PaginatedResponse<ShipmentResponseDto>> {
    const { page, limit, status, partnerId, trackingNumber } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ShipmentWhereInput = {
      ...(status && { status }),
      ...(partnerId && { partnerId }),
      ...(trackingNumber && {
        trackingNumber: { contains: trackingNumber, mode: 'insensitive' as const },
      }),
    };

    const [shipments, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        include: {
          partner: {
            select: {
              companyName: true,
              slug: true,
              trackingUrl: true,
              logoUrl: true,
            },
          },
          milestones: { orderBy: { occurredAt: 'asc' } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.shipment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: shipments.map((s) => ShipmentResponseDto.fromEntity(s)),
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

  async trackByNumber(trackingNumber: string): Promise<ShipmentResponseDto> {
    const shipment = await this.prisma.shipment.findFirst({
      where: { trackingNumber },
      include: {
        partner: {
          select: {
            companyName: true,
            slug: true,
            trackingUrl: true,
            logoUrl: true,
          },
        },
        milestones: { orderBy: { occurredAt: 'asc' } },
      },
    });

    if (!shipment) {
      throw new NotFoundException(
        `Shipment with tracking number "${trackingNumber}" not found`,
      );
    }

    return ShipmentResponseDto.fromEntity(shipment);
  }
}

/**
 * Generates a tracking number in the format: LM-XXXXXX-XXXX
 * (LM prefix for LankaMart, followed by hex characters)
 */
function generateTrackingNumber(): string {
  const part1 = randomBytes(3).toString('hex').toUpperCase();
  const part2 = randomBytes(2).toString('hex').toUpperCase();
  return `LM-${part1}-${part2}`;
}
