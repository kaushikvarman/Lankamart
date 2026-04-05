import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ShippingMode } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '@/common/prisma/prisma.service';
import { LogisticsService } from './logistics.service';
import { CreateLogisticsPartnerDto } from './dto/create-logistics-partner.dto';
import { CreateShippingRateDto } from './dto/create-shipping-rate.dto';
import { CreateShipmentDto } from './dto/create-shipment.dto';

const MOCK_PARTNER_ID = 'partner-001';
const MOCK_PARTNER_ID_2 = 'partner-002';
const MOCK_ZONE_ORIGIN_ID = 'zone-origin-001';
const MOCK_ZONE_DEST_ID = 'zone-dest-001';
const MOCK_RATE_ID = 'rate-001';
const MOCK_RATE_ID_2 = 'rate-002';
const MOCK_SHIPMENT_ID = 'shipment-001';
const MOCK_ORDER_ITEM_ID = 'order-item-001';
const MOCK_VENDOR_ID = 'vendor-001';
const MOCK_OTHER_VENDOR_ID = 'vendor-002';
const MOCK_MILESTONE_ID = 'milestone-001';

const mockPartner = {
  id: MOCK_PARTNER_ID,
  userId: null,
  companyName: 'Ceylon Freight Express',
  slug: 'ceylon-freight-express-abc123',
  description: 'Leading freight provider',
  logoUrl: null,
  contactEmail: 'info@ceylonfreight.lk',
  contactPhone: '+94112345678',
  website: 'https://ceylonfreight.lk',
  coverageAreas: '{"countries":["LK","IN"]}',
  shippingModes: JSON.stringify([ShippingMode.AIR_FREIGHT, ShippingMode.SEA_FREIGHT_FCL]),
  certifications: '["ISO 9001"]',
  insuranceOffered: true,
  trackingEnabled: true,
  trackingUrl: 'https://ceylonfreight.lk/track/{tracking_number}',
  isActive: true,
  isVerified: false,
  averageRating: new Decimal('4.20'),
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  _count: { shipments: 150 },
};

const mockZoneOrigin = {
  id: MOCK_ZONE_ORIGIN_ID,
  name: 'South Asia',
  countries: JSON.stringify(['LK', 'IN', 'BD']),
  regions: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockZoneDest = {
  id: MOCK_ZONE_DEST_ID,
  name: 'North America',
  countries: JSON.stringify(['US', 'CA']),
  regions: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockRate = {
  id: MOCK_RATE_ID,
  partnerId: MOCK_PARTNER_ID,
  originZoneId: MOCK_ZONE_ORIGIN_ID,
  destinationZoneId: MOCK_ZONE_DEST_ID,
  shippingMode: ShippingMode.AIR_FREIGHT,
  currency: 'USD',
  baseRate: new Decimal('50.00'),
  perKgRate: new Decimal('5.00'),
  perCbmRate: null,
  minWeight: new Decimal('0'),
  maxWeight: new Decimal('100'),
  minTransitDays: 3,
  maxTransitDays: 7,
  fuelSurcharge: new Decimal('10.00'),
  insuranceRate: new Decimal('2.00'),
  isActive: true,
  validFrom: new Date('2025-01-01'),
  validUntil: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  partner: { companyName: 'Ceylon Freight Express' },
  originZone: { name: 'South Asia' },
  destinationZone: { name: 'North America' },
};

const mockShippingAddress = {
  id: 'addr-001',
  userId: 'buyer-001',
  label: 'home',
  fullName: 'John Doe',
  addressLine1: '123 Main St',
  addressLine2: null,
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'US',
  phone: '+12125551234',
  isDefault: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockOrderItem = {
  id: MOCK_ORDER_ITEM_ID,
  orderId: 'order-001',
  productId: 'product-001',
  variantId: null,
  vendorId: MOCK_VENDOR_ID,
  quantity: 10,
  unitPrice: new Decimal('29.99'),
  totalPrice: new Decimal('299.90'),
  currency: 'USD',
  status: 'CONFIRMED',
  trackingNo: null,
  shippedAt: null,
  deliveredAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  order: {
    id: 'order-001',
    shippingAddress: mockShippingAddress,
  },
  shipment: null,
};

const mockActivePartner = {
  id: MOCK_PARTNER_ID,
  companyName: 'Ceylon Freight Express',
  logoUrl: null,
  isActive: true,
  insuranceOffered: true,
  slug: 'ceylon-freight-express-abc123',
  trackingUrl: 'https://ceylonfreight.lk/track/{tracking_number}',
};

const mockShipment = {
  id: MOCK_SHIPMENT_ID,
  orderItemId: MOCK_ORDER_ITEM_ID,
  partnerId: MOCK_PARTNER_ID,
  trackingNumber: 'LM-ABC123-DEF4',
  shippingMode: ShippingMode.AIR_FREIGHT,
  status: 'booked',
  weight: new Decimal('5.500'),
  dimensions: '30x20x15',
  declaredValue: new Decimal('500.00'),
  shippingCost: new Decimal('0.00'),
  currency: 'USD',
  estimatedDelivery: null,
  actualDelivery: null,
  originAddress: '{}',
  destAddress: '{}',
  customsDocUrl: null,
  proofOfDelivery: null,
  notes: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  partner: {
    companyName: 'Ceylon Freight Express',
    slug: 'ceylon-freight-express-abc123',
    trackingUrl: 'https://ceylonfreight.lk/track/{tracking_number}',
    logoUrl: null,
  },
  milestones: [
    {
      id: MOCK_MILESTONE_ID,
      shipmentId: MOCK_SHIPMENT_ID,
      status: 'booked',
      location: null,
      description: 'Shipment booked with logistics partner',
      occurredAt: new Date('2025-01-01'),
      createdAt: new Date('2025-01-01'),
    },
  ],
};

describe('LogisticsService', () => {
  let service: LogisticsService;
  let prisma: {
    logisticsPartner: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    shippingZone: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
    shippingRate: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    shipment: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    shipmentMilestone: {
      create: jest.Mock;
    };
    orderItem: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      logisticsPartner: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      shippingZone: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      shippingRate: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      shipment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      shipmentMilestone: {
        create: jest.fn(),
      },
      orderItem: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogisticsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<LogisticsService>(LogisticsService);
  });

  // ---------------------------------------------------------------------------
  // Partners
  // ---------------------------------------------------------------------------
  describe('createPartner', () => {
    const dto: CreateLogisticsPartnerDto = {
      companyName: 'Ceylon Freight Express',
      description: 'Leading freight provider',
      contactEmail: 'info@ceylonfreight.lk',
      contactPhone: '+94112345678',
      website: 'https://ceylonfreight.lk',
      coverageAreas: '{"countries":["LK","IN"]}',
      shippingModes: [ShippingMode.AIR_FREIGHT, ShippingMode.SEA_FREIGHT_FCL],
      certifications: '["ISO 9001"]',
      insuranceOffered: true,
      trackingEnabled: true,
      trackingUrl: 'https://ceylonfreight.lk/track/{tracking_number}',
    };

    it('should create a logistics partner with auto-generated slug', async () => {
      prisma.logisticsPartner.create.mockResolvedValue(mockPartner);

      const result = await service.createPartner(dto);

      expect(result.companyName).toBe('Ceylon Freight Express');
      expect(result.averageRating).toBe(4.2);
      expect(result.shipmentCount).toBe(150);
      expect(result.shippingModes).toEqual([
        ShippingMode.AIR_FREIGHT,
        ShippingMode.SEA_FREIGHT_FCL,
      ]);
      expect(prisma.logisticsPartner.create).toHaveBeenCalledTimes(1);

      const createCall = prisma.logisticsPartner.create.mock.calls[0]![0]!;
      expect(createCall.data.companyName).toBe('Ceylon Freight Express');
      expect(createCall.data.slug).toMatch(/^ceylon-freight-express-[a-f0-9]{6}$/);
      expect(createCall.data.shippingModes).toBe(
        JSON.stringify([ShippingMode.AIR_FREIGHT, ShippingMode.SEA_FREIGHT_FCL]),
      );
    });
  });

  describe('updatePartner', () => {
    it('should update a logistics partner', async () => {
      prisma.logisticsPartner.findUnique.mockResolvedValue(mockPartner);
      prisma.logisticsPartner.update.mockResolvedValue({
        ...mockPartner,
        description: 'Updated description',
      });

      const result = await service.updatePartner(MOCK_PARTNER_ID, {
        description: 'Updated description',
      });

      expect(result.description).toBe('Updated description');
    });

    it('should regenerate slug when companyName changes', async () => {
      prisma.logisticsPartner.findUnique.mockResolvedValue(mockPartner);
      prisma.logisticsPartner.update.mockResolvedValue({
        ...mockPartner,
        companyName: 'New Company Name',
      });

      await service.updatePartner(MOCK_PARTNER_ID, {
        companyName: 'New Company Name',
      });

      const updateCall = prisma.logisticsPartner.update.mock.calls[0]![0]!;
      expect(updateCall.data.slug).toMatch(/^new-company-name-[a-f0-9]{6}$/);
    });

    it('should throw NotFoundException if partner not found', async () => {
      prisma.logisticsPartner.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePartner('nonexistent', { description: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPartnerBySlug', () => {
    it('should return partner by slug', async () => {
      prisma.logisticsPartner.findUnique.mockResolvedValue(mockPartner);

      const result = await service.getPartnerBySlug(mockPartner.slug);

      expect(result.companyName).toBe('Ceylon Freight Express');
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.logisticsPartner.findUnique.mockResolvedValue(null);

      await expect(
        service.getPartnerBySlug('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if partner is inactive', async () => {
      prisma.logisticsPartner.findUnique.mockResolvedValue({
        ...mockPartner,
        isActive: false,
      });

      await expect(
        service.getPartnerBySlug(mockPartner.slug),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listPartners', () => {
    it('should return list of active partners', async () => {
      prisma.logisticsPartner.findMany.mockResolvedValue([mockPartner]);

      const result = await service.listPartners();

      expect(result).toHaveLength(1);
      expect(result[0]!.companyName).toBe('Ceylon Freight Express');

      const findCall = prisma.logisticsPartner.findMany.mock.calls[0]![0]!;
      expect(findCall.where.isActive).toBe(true);
    });

    it('should filter by search term', async () => {
      prisma.logisticsPartner.findMany.mockResolvedValue([]);

      await service.listPartners('freight');

      const findCall = prisma.logisticsPartner.findMany.mock.calls[0]![0]!;
      expect(findCall.where.companyName).toEqual({
        contains: 'freight',
        mode: 'insensitive',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rates
  // ---------------------------------------------------------------------------
  describe('createRate', () => {
    const dto: CreateShippingRateDto = {
      partnerId: MOCK_PARTNER_ID,
      originZoneId: MOCK_ZONE_ORIGIN_ID,
      destinationZoneId: MOCK_ZONE_DEST_ID,
      shippingMode: ShippingMode.AIR_FREIGHT,
      baseRate: '50.00',
      perKgRate: '5.00',
      minTransitDays: 3,
      maxTransitDays: 7,
      fuelSurcharge: '10.00',
      insuranceRate: '2.00',
    };

    it('should create a shipping rate', async () => {
      prisma.logisticsPartner.findUnique.mockResolvedValue(mockPartner);
      prisma.shippingZone.findUnique
        .mockResolvedValueOnce(mockZoneOrigin)
        .mockResolvedValueOnce(mockZoneDest);
      prisma.shippingRate.create.mockResolvedValue(mockRate);

      const result = await service.createRate(dto);

      expect(result.baseRate).toBe(50);
      expect(result.perKgRate).toBe(5);
      expect(result.partnerName).toBe('Ceylon Freight Express');
      expect(result.originZoneName).toBe('South Asia');
      expect(result.destinationZoneName).toBe('North America');
    });

    it('should throw NotFoundException if partner not found', async () => {
      prisma.logisticsPartner.findUnique.mockResolvedValue(null);
      prisma.shippingZone.findUnique
        .mockResolvedValueOnce(mockZoneOrigin)
        .mockResolvedValueOnce(mockZoneDest);

      await expect(service.createRate(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if origin zone not found', async () => {
      prisma.logisticsPartner.findUnique.mockResolvedValue(mockPartner);
      prisma.shippingZone.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockZoneDest);

      await expect(service.createRate(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when minTransitDays > maxTransitDays', async () => {
      prisma.logisticsPartner.findUnique.mockResolvedValue(mockPartner);
      prisma.shippingZone.findUnique
        .mockResolvedValueOnce(mockZoneOrigin)
        .mockResolvedValueOnce(mockZoneDest);

      await expect(
        service.createRate({ ...dto, minTransitDays: 14, maxTransitDays: 3 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateRate', () => {
    it('should update a shipping rate', async () => {
      prisma.shippingRate.findUnique.mockResolvedValue(mockRate);
      prisma.shippingRate.update.mockResolvedValue({
        ...mockRate,
        baseRate: new Decimal('60.00'),
      });

      const result = await service.updateRate(MOCK_RATE_ID, {
        baseRate: '60.00',
      });

      expect(result.baseRate).toBe(60);
    });

    it('should throw NotFoundException if rate not found', async () => {
      prisma.shippingRate.findUnique.mockResolvedValue(null);

      await expect(
        service.updateRate('nonexistent', { baseRate: '60.00' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if updated transit days are invalid', async () => {
      prisma.shippingRate.findUnique.mockResolvedValue(mockRate);

      await expect(
        service.updateRate(MOCK_RATE_ID, { minTransitDays: 20 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteRate', () => {
    it('should soft delete a rate by setting isActive=false', async () => {
      prisma.shippingRate.findUnique.mockResolvedValue(mockRate);
      prisma.shippingRate.update.mockResolvedValue({
        ...mockRate,
        isActive: false,
      });

      const result = await service.deleteRate(MOCK_RATE_ID);

      expect(result.message).toContain('deactivated');
      expect(prisma.shippingRate.update).toHaveBeenCalledWith({
        where: { id: MOCK_RATE_ID },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException if rate not found', async () => {
      prisma.shippingRate.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteRate('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // calculateShipping
  // ---------------------------------------------------------------------------
  describe('calculateShipping', () => {
    const rateForCalc = {
      ...mockRate,
      partner: {
        id: MOCK_PARTNER_ID,
        companyName: 'Ceylon Freight Express',
        logoUrl: null,
        isActive: true,
        insuranceOffered: true,
      },
    };

    it('should calculate basic shipping cost', async () => {
      prisma.shippingZone.findMany.mockResolvedValue([
        mockZoneOrigin,
        mockZoneDest,
      ]);
      prisma.shippingRate.findMany.mockResolvedValue([rateForCalc]);

      const result = await service.calculateShipping({
        originCountry: 'LK',
        destinationCountry: 'US',
        weight: '10.000',
      });

      expect(result).toHaveLength(1);
      // cost = (50 + 10 * 5) * (1 + 10/100) = 100 * 1.1 = 110
      expect(result[0]!.cost).toBe(110);
      expect(result[0]!.partnerName).toBe('Ceylon Freight Express');
      expect(result[0]!.shippingMode).toBe(ShippingMode.AIR_FREIGHT);
    });

    it('should use dimensional weight when greater than actual weight', async () => {
      prisma.shippingZone.findMany.mockResolvedValue([
        mockZoneOrigin,
        mockZoneDest,
      ]);
      prisma.shippingRate.findMany.mockResolvedValue([rateForCalc]);

      // Dimensional weight: (50 * 40 * 30) / 5000 = 12 kg (greater than 5)
      const result = await service.calculateShipping({
        originCountry: 'LK',
        destinationCountry: 'US',
        weight: '5.000',
        length: '50.00',
        width: '40.00',
        height: '30.00',
      });

      expect(result).toHaveLength(1);
      // cost = (50 + 12 * 5) * (1 + 10/100) = 110 * 1.1 = 121
      expect(result[0]!.cost).toBe(121);
    });

    it('should calculate fuel surcharge correctly', async () => {
      const rateWithHighFuel = {
        ...rateForCalc,
        fuelSurcharge: new Decimal('25.00'),
      };
      prisma.shippingZone.findMany.mockResolvedValue([
        mockZoneOrigin,
        mockZoneDest,
      ]);
      prisma.shippingRate.findMany.mockResolvedValue([rateWithHighFuel]);

      const result = await service.calculateShipping({
        originCountry: 'LK',
        destinationCountry: 'US',
        weight: '10.000',
      });

      // cost = (50 + 10 * 5) * (1 + 25/100) = 100 * 1.25 = 125
      expect(result[0]!.cost).toBe(125);
    });

    it('should calculate insurance cost when declared value is provided', async () => {
      prisma.shippingZone.findMany.mockResolvedValue([
        mockZoneOrigin,
        mockZoneDest,
      ]);
      prisma.shippingRate.findMany.mockResolvedValue([rateForCalc]);

      const result = await service.calculateShipping({
        originCountry: 'LK',
        destinationCountry: 'US',
        weight: '10.000',
        declaredValue: '1000.00',
      });

      // insurance = 1000 * 2/100 = 20
      expect(result[0]!.insuranceCost).toBe(20);
    });

    it('should return empty array when no zones match', async () => {
      prisma.shippingZone.findMany.mockResolvedValue([mockZoneOrigin]);

      const result = await service.calculateShipping({
        originCountry: 'LK',
        destinationCountry: 'JP',
        weight: '10.000',
      });

      expect(result).toEqual([]);
    });

    it('should filter out rates exceeding max weight', async () => {
      const rateWithLowMaxWeight = {
        ...rateForCalc,
        maxWeight: new Decimal('5'),
      };
      prisma.shippingZone.findMany.mockResolvedValue([
        mockZoneOrigin,
        mockZoneDest,
      ]);
      prisma.shippingRate.findMany.mockResolvedValue([rateWithLowMaxWeight]);

      const result = await service.calculateShipping({
        originCountry: 'LK',
        destinationCountry: 'US',
        weight: '10.000',
      });

      expect(result).toEqual([]);
    });

    it('should sort quotes by cost ascending', async () => {
      const cheapRate = {
        ...rateForCalc,
        id: MOCK_RATE_ID,
        baseRate: new Decimal('20.00'),
        perKgRate: new Decimal('1.00'),
        fuelSurcharge: new Decimal('0'),
      };
      const expensiveRate = {
        ...rateForCalc,
        id: MOCK_RATE_ID_2,
        baseRate: new Decimal('200.00'),
        perKgRate: new Decimal('10.00'),
        fuelSurcharge: new Decimal('0'),
        shippingMode: ShippingMode.COURIER_EXPRESS,
        partner: {
          ...rateForCalc.partner,
          id: MOCK_PARTNER_ID_2,
          companyName: 'DHL Express',
        },
      };
      prisma.shippingZone.findMany.mockResolvedValue([
        mockZoneOrigin,
        mockZoneDest,
      ]);
      prisma.shippingRate.findMany.mockResolvedValue([
        expensiveRate,
        cheapRate,
      ]);

      const result = await service.calculateShipping({
        originCountry: 'LK',
        destinationCountry: 'US',
        weight: '5.000',
      });

      expect(result).toHaveLength(2);
      // cheap: 20 + 5*1 = 25, expensive: 200 + 5*10 = 250
      expect(result[0]!.cost).toBe(25);
      expect(result[1]!.cost).toBe(250);
    });
  });

  // ---------------------------------------------------------------------------
  // Shipments
  // ---------------------------------------------------------------------------
  describe('createShipment', () => {
    const dto: CreateShipmentDto = {
      orderItemId: MOCK_ORDER_ITEM_ID,
      partnerId: MOCK_PARTNER_ID,
      shippingMode: ShippingMode.AIR_FREIGHT,
      weight: '5.500',
      dimensions: '30x20x15',
      declaredValue: '500.00',
    };

    it('should create a shipment with tracking number and initial milestone', async () => {
      prisma.orderItem.findUnique.mockResolvedValue(mockOrderItem);
      prisma.logisticsPartner.findUnique.mockResolvedValue(mockActivePartner);
      prisma.$transaction.mockImplementation(
        async (fn: (tx: typeof prisma) => Promise<typeof mockShipment>) => fn(prisma),
      );
      prisma.shipment.create.mockResolvedValue(mockShipment);
      prisma.shipmentMilestone.create.mockResolvedValue({
        id: MOCK_MILESTONE_ID,
        shipmentId: MOCK_SHIPMENT_ID,
        status: 'booked',
        description: 'Shipment booked with logistics partner',
        occurredAt: new Date(),
        createdAt: new Date(),
      });
      prisma.orderItem.update.mockResolvedValue({});
      prisma.shipment.findUniqueOrThrow.mockResolvedValue(mockShipment);

      const result = await service.createShipment(MOCK_VENDOR_ID, dto);

      expect(result.status).toBe('booked');
      expect(result.partnerName).toBe('Ceylon Freight Express');
      expect(result.milestones).toHaveLength(1);
      expect(result.milestones[0]!.status).toBe('booked');
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if order item not found', async () => {
      prisma.orderItem.findUnique.mockResolvedValue(null);

      await expect(
        service.createShipment(MOCK_VENDOR_ID, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if vendor does not own order item', async () => {
      prisma.orderItem.findUnique.mockResolvedValue(mockOrderItem);

      await expect(
        service.createShipment(MOCK_OTHER_VENDOR_ID, dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if shipment already exists', async () => {
      prisma.orderItem.findUnique.mockResolvedValue({
        ...mockOrderItem,
        shipment: mockShipment,
      });

      await expect(
        service.createShipment(MOCK_VENDOR_ID, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if partner not found', async () => {
      prisma.orderItem.findUnique.mockResolvedValue(mockOrderItem);
      prisma.logisticsPartner.findUnique.mockResolvedValue(null);

      await expect(
        service.createShipment(MOCK_VENDOR_ID, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if partner is inactive', async () => {
      prisma.orderItem.findUnique.mockResolvedValue(mockOrderItem);
      prisma.logisticsPartner.findUnique.mockResolvedValue({
        ...mockActivePartner,
        isActive: false,
      });

      await expect(
        service.createShipment(MOCK_VENDOR_ID, dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addMilestone', () => {
    it('should add a milestone and update shipment status', async () => {
      prisma.shipment.findUnique.mockResolvedValue(mockShipment);
      prisma.$transaction.mockImplementation(
        async (fn: (tx: typeof prisma) => Promise<void>) => fn(prisma),
      );
      prisma.shipmentMilestone.create.mockResolvedValue({
        id: 'milestone-002',
        shipmentId: MOCK_SHIPMENT_ID,
        status: 'in_transit',
        location: 'Colombo Port',
        description: 'Package dispatched',
        occurredAt: new Date(),
        createdAt: new Date(),
      });
      prisma.shipment.update.mockResolvedValue({
        ...mockShipment,
        status: 'in_transit',
      });
      prisma.shipment.findUniqueOrThrow.mockResolvedValue({
        ...mockShipment,
        status: 'in_transit',
        milestones: [
          ...mockShipment.milestones,
          {
            id: 'milestone-002',
            shipmentId: MOCK_SHIPMENT_ID,
            status: 'in_transit',
            location: 'Colombo Port',
            description: 'Package dispatched',
            occurredAt: new Date(),
            createdAt: new Date(),
          },
        ],
      });

      const result = await service.addMilestone(MOCK_SHIPMENT_ID, {
        status: 'in_transit',
        location: 'Colombo Port',
        description: 'Package dispatched',
        occurredAt: new Date(),
      });

      expect(result.status).toBe('in_transit');
      expect(result.milestones).toHaveLength(2);
    });

    it('should set actualDelivery when status is delivered', async () => {
      prisma.shipment.findUnique.mockResolvedValue(mockShipment);
      const deliveryDate = new Date();
      prisma.$transaction.mockImplementation(
        async (fn: (tx: typeof prisma) => Promise<void>) => fn(prisma),
      );
      prisma.shipmentMilestone.create.mockResolvedValue({});
      prisma.shipment.update.mockResolvedValue({});
      prisma.shipment.findUniqueOrThrow.mockResolvedValue({
        ...mockShipment,
        status: 'delivered',
        actualDelivery: deliveryDate,
      });

      await service.addMilestone(MOCK_SHIPMENT_ID, {
        status: 'delivered',
        location: 'New York',
        description: 'Package delivered',
        occurredAt: deliveryDate,
      });

      const updateCall = prisma.shipment.update.mock.calls[0]![0]!;
      expect(updateCall.data.status).toBe('delivered');
      expect(updateCall.data.actualDelivery).toBe(deliveryDate);
    });

    it('should throw NotFoundException if shipment not found', async () => {
      prisma.shipment.findUnique.mockResolvedValue(null);

      await expect(
        service.addMilestone('nonexistent', {
          status: 'in_transit',
          occurredAt: new Date(),
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getShipment', () => {
    it('should return shipment with milestones', async () => {
      prisma.shipment.findUnique.mockResolvedValue(mockShipment);

      const result = await service.getShipment(MOCK_SHIPMENT_ID);

      expect(result.id).toBe(MOCK_SHIPMENT_ID);
      expect(result.trackingLink).toBe(
        'https://ceylonfreight.lk/track/LM-ABC123-DEF4',
      );
      expect(result.milestones).toHaveLength(1);
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.shipment.findUnique.mockResolvedValue(null);

      await expect(
        service.getShipment('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('trackByNumber', () => {
    it('should return shipment by tracking number', async () => {
      prisma.shipment.findFirst.mockResolvedValue(mockShipment);

      const result = await service.trackByNumber('LM-ABC123-DEF4');

      expect(result.trackingNumber).toBe('LM-ABC123-DEF4');
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.shipment.findFirst.mockResolvedValue(null);

      await expect(
        service.trackByNumber('INVALID'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listShipments', () => {
    it('should return paginated shipments', async () => {
      prisma.shipment.findMany.mockResolvedValue([mockShipment]);
      prisma.shipment.count.mockResolvedValue(1);

      const result = await service.listShipments({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by status', async () => {
      prisma.shipment.findMany.mockResolvedValue([]);
      prisma.shipment.count.mockResolvedValue(0);

      await service.listShipments({
        page: 1,
        limit: 20,
        status: 'in_transit',
      });

      const findCall = prisma.shipment.findMany.mock.calls[0]![0]!;
      expect(findCall.where.status).toBe('in_transit');
    });

    it('should filter by partnerId', async () => {
      prisma.shipment.findMany.mockResolvedValue([]);
      prisma.shipment.count.mockResolvedValue(0);

      await service.listShipments({
        page: 1,
        limit: 20,
        partnerId: MOCK_PARTNER_ID,
      });

      const findCall = prisma.shipment.findMany.mock.calls[0]![0]!;
      expect(findCall.where.partnerId).toBe(MOCK_PARTNER_ID);
    });
  });
});
