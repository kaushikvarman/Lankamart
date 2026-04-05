import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RfqStatus, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RfqService } from './rfq.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { CreateRfqQuoteDto } from './dto/create-rfq-quote.dto';

const MOCK_BUYER_ID = 'buyer-001';
const MOCK_VENDOR_ID = 'vendor-001';
const MOCK_VENDOR_ID_2 = 'vendor-002';
const MOCK_RFQ_ID = 'rfq-001';
const MOCK_QUOTE_ID = 'quote-001';
const MOCK_PRODUCT_ID = 'product-001';

const mockBuyer = {
  id: MOCK_BUYER_ID,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
};

const mockVendorProfile = {
  id: 'vp-001',
  businessName: 'Ceylon Spices Co.',
  businessSlug: 'ceylon-spices-co',
  isVerified: true,
};

const mockProduct = {
  id: MOCK_PRODUCT_ID,
  name: 'Ceylon Cinnamon',
  slug: 'ceylon-cinnamon-abc123',
  deletedAt: null,
};

const mockRfq = {
  id: MOCK_RFQ_ID,
  buyerId: MOCK_BUYER_ID,
  productId: MOCK_PRODUCT_ID,
  title: 'Need 500kg cinnamon',
  description: 'Looking for high-grade Ceylon cinnamon',
  quantity: 500,
  unit: 'kg',
  targetPrice: new Decimal('20.00'),
  currency: 'USD',
  deliveryAddr: '{"city":"Colombo","country":"LK"}',
  requiredBy: new Date('2026-06-01'),
  attachments: null,
  status: RfqStatus.OPEN,
  expiresAt: new Date('2026-05-01'),
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  buyer: mockBuyer,
  product: mockProduct,
  quotes: [],
};

const mockQuote = {
  id: MOCK_QUOTE_ID,
  rfqId: MOCK_RFQ_ID,
  vendorId: MOCK_VENDOR_ID,
  unitPrice: new Decimal('18.00'),
  totalPrice: new Decimal('9000.00'),
  currency: 'USD',
  leadTimeDays: 14,
  validUntil: new Date('2026-05-15'),
  notes: 'Best price for this grade',
  attachments: null,
  isAccepted: false,
  createdAt: new Date('2025-01-02'),
  updatedAt: new Date('2025-01-02'),
  vendor: {
    vendorProfile: mockVendorProfile,
  },
  rfq: mockRfq,
};

describe('RfqService', () => {
  let service: RfqService;
  let prisma: {
    product: { findUnique: jest.Mock };
    rfq: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    rfqQuote: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      product: { findUnique: jest.fn() },
      rfq: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      rfqQuote: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RfqService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RfqService>(RfqService);
  });

  // ---------------------------------------------------------------------------
  // createRfq
  // ---------------------------------------------------------------------------
  describe('createRfq', () => {
    const dto: CreateRfqDto = {
      title: 'Need 500kg cinnamon',
      description: 'Looking for high-grade Ceylon cinnamon',
      productId: MOCK_PRODUCT_ID,
      quantity: 500,
      unit: 'kg',
      targetPrice: 20.0,
      deliveryAddress: '{"city":"Colombo","country":"LK"}',
      expiresAt: '2026-05-01T00:00:00.000Z',
    };

    it('should create an RFQ with OPEN status', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.rfq.create.mockResolvedValue(mockRfq);

      const result = await service.createRfq(MOCK_BUYER_ID, dto);

      expect(result.title).toBe('Need 500kg cinnamon');
      expect(result.status).toBe(RfqStatus.OPEN);
      expect(result.quantity).toBe(500);
      expect(prisma.rfq.create).toHaveBeenCalledTimes(1);
    });

    it('should create RFQ without productId', async () => {
      const dtoWithoutProduct: CreateRfqDto = {
        ...dto,
        productId: undefined,
      };

      prisma.rfq.create.mockResolvedValue({
        ...mockRfq,
        productId: null,
        product: null,
      });

      const result = await service.createRfq(MOCK_BUYER_ID, dtoWithoutProduct);

      expect(result.product).toBeNull();
      expect(prisma.product.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.createRfq(MOCK_BUYER_ID, dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // listRfqs
  // ---------------------------------------------------------------------------
  describe('listRfqs', () => {
    it('should return only buyer own RFQs for BUYER role', async () => {
      prisma.rfq.findMany.mockResolvedValue([mockRfq]);
      prisma.rfq.count.mockResolvedValue(1);

      const result = await service.listRfqs(MOCK_BUYER_ID, UserRole.BUYER, {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      const findCall = prisma.rfq.findMany.mock.calls[0][0];
      expect(findCall.where.buyerId).toBe(MOCK_BUYER_ID);
    });

    it('should show OPEN RFQs for VENDOR role by default', async () => {
      prisma.rfq.findMany.mockResolvedValue([mockRfq]);
      prisma.rfq.count.mockResolvedValue(1);

      await service.listRfqs(MOCK_VENDOR_ID, UserRole.VENDOR, {
        page: 1,
        limit: 20,
      });

      const findCall = prisma.rfq.findMany.mock.calls[0][0];
      expect(findCall.where.status).toBe(RfqStatus.OPEN);
    });

    it('should show all RFQs for ADMIN role', async () => {
      prisma.rfq.findMany.mockResolvedValue([]);
      prisma.rfq.count.mockResolvedValue(0);

      await service.listRfqs('admin-001', UserRole.ADMIN, {
        page: 1,
        limit: 20,
      });

      const findCall = prisma.rfq.findMany.mock.calls[0][0];
      expect(findCall.where.buyerId).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // getRfqById
  // ---------------------------------------------------------------------------
  describe('getRfqById', () => {
    it('should return RFQ for the buyer', async () => {
      prisma.rfq.findUnique.mockResolvedValue(mockRfq);

      const result = await service.getRfqById(MOCK_RFQ_ID, MOCK_BUYER_ID, UserRole.BUYER);

      expect(result.id).toBe(MOCK_RFQ_ID);
    });

    it('should return RFQ for vendor', async () => {
      prisma.rfq.findUnique.mockResolvedValue(mockRfq);

      const result = await service.getRfqById(MOCK_RFQ_ID, MOCK_VENDOR_ID, UserRole.VENDOR);

      expect(result.id).toBe(MOCK_RFQ_ID);
    });

    it('should throw ForbiddenException when buyer tries to view another buyers RFQ', async () => {
      prisma.rfq.findUnique.mockResolvedValue(mockRfq);

      await expect(
        service.getRfqById(MOCK_RFQ_ID, 'other-buyer', UserRole.BUYER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent RFQ', async () => {
      prisma.rfq.findUnique.mockResolvedValue(null);

      await expect(
        service.getRfqById('nonexistent', MOCK_BUYER_ID, UserRole.BUYER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // submitQuote
  // ---------------------------------------------------------------------------
  describe('submitQuote', () => {
    const quoteDto: CreateRfqQuoteDto = {
      rfqId: MOCK_RFQ_ID,
      unitPrice: 18.0,
      totalPrice: 9000.0,
      currency: 'USD',
      leadTimeDays: 14,
      validUntil: '2026-05-15T00:00:00.000Z',
      notes: 'Best price',
    };

    it('should submit a quote for an open RFQ', async () => {
      prisma.rfq.findUnique.mockResolvedValue(mockRfq);
      prisma.rfqQuote.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation(
        async (fn: (tx: typeof prisma) => Promise<typeof mockQuote>) => fn(prisma),
      );
      prisma.rfqQuote.create.mockResolvedValue(mockQuote);
      prisma.rfq.update.mockResolvedValue({ ...mockRfq, status: RfqStatus.QUOTED });

      const result = await service.submitQuote(MOCK_VENDOR_ID, quoteDto);

      expect(result.unitPrice).toBeCloseTo(18.0);
      expect(result.totalPrice).toBeCloseTo(9000.0);
      expect(prisma.rfqQuote.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException for duplicate quote', async () => {
      prisma.rfq.findUnique.mockResolvedValue(mockRfq);
      prisma.rfqQuote.findUnique.mockResolvedValue(mockQuote);

      await expect(
        service.submitQuote(MOCK_VENDOR_ID, quoteDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for non-OPEN RFQ', async () => {
      prisma.rfq.findUnique.mockResolvedValue({
        ...mockRfq,
        status: RfqStatus.ACCEPTED,
      });

      await expect(
        service.submitQuote(MOCK_VENDOR_ID, quoteDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired RFQ', async () => {
      prisma.rfq.findUnique.mockResolvedValue({
        ...mockRfq,
        expiresAt: new Date('2020-01-01'),
      });

      await expect(
        service.submitQuote(MOCK_VENDOR_ID, quoteDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent RFQ', async () => {
      prisma.rfq.findUnique.mockResolvedValue(null);

      await expect(
        service.submitQuote(MOCK_VENDOR_ID, quoteDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // acceptQuote
  // ---------------------------------------------------------------------------
  describe('acceptQuote', () => {
    it('should accept a quote and update RFQ status', async () => {
      prisma.rfqQuote.findUnique.mockResolvedValue(mockQuote);
      prisma.$transaction.mockImplementation(
        async (fn: (tx: typeof prisma) => Promise<typeof mockQuote>) => fn(prisma),
      );
      prisma.rfqQuote.update.mockResolvedValue({
        ...mockQuote,
        isAccepted: true,
      });
      prisma.rfq.update.mockResolvedValue({
        ...mockRfq,
        status: RfqStatus.ACCEPTED,
      });

      const result = await service.acceptQuote(MOCK_BUYER_ID, MOCK_QUOTE_ID);

      expect(result.isAccepted).toBe(true);
      expect(prisma.rfq.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: RfqStatus.ACCEPTED },
        }),
      );
    });

    it('should throw ForbiddenException when non-owner tries to accept', async () => {
      prisma.rfqQuote.findUnique.mockResolvedValue(mockQuote);

      await expect(
        service.acceptQuote('other-buyer', MOCK_QUOTE_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when RFQ already accepted', async () => {
      prisma.rfqQuote.findUnique.mockResolvedValue({
        ...mockQuote,
        rfq: { ...mockRfq, status: RfqStatus.ACCEPTED },
      });

      await expect(
        service.acceptQuote(MOCK_BUYER_ID, MOCK_QUOTE_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when quote already accepted', async () => {
      prisma.rfqQuote.findUnique.mockResolvedValue({
        ...mockQuote,
        isAccepted: true,
      });

      await expect(
        service.acceptQuote(MOCK_BUYER_ID, MOCK_QUOTE_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent quote', async () => {
      prisma.rfqQuote.findUnique.mockResolvedValue(null);

      await expect(
        service.acceptQuote(MOCK_BUYER_ID, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // declineQuote
  // ---------------------------------------------------------------------------
  describe('declineQuote', () => {
    it('should decline a quote and delete it', async () => {
      prisma.rfqQuote.findUnique.mockResolvedValue(mockQuote);
      prisma.$transaction.mockImplementation(
        async (fn: (tx: typeof prisma) => Promise<typeof mockQuote>) => fn(prisma),
      );
      prisma.rfqQuote.delete.mockResolvedValue(mockQuote);
      prisma.rfqQuote.count.mockResolvedValue(0);
      prisma.rfq.update.mockResolvedValue({
        ...mockRfq,
        status: RfqStatus.OPEN,
      });

      const result = await service.declineQuote(MOCK_BUYER_ID, MOCK_QUOTE_ID);

      expect(result.id).toBe(MOCK_QUOTE_ID);
      expect(prisma.rfqQuote.delete).toHaveBeenCalledWith({
        where: { id: MOCK_QUOTE_ID },
      });
    });

    it('should throw ForbiddenException when non-owner tries to decline', async () => {
      prisma.rfqQuote.findUnique.mockResolvedValue(mockQuote);

      await expect(
        service.declineQuote('other-buyer', MOCK_QUOTE_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when declining an accepted quote', async () => {
      prisma.rfqQuote.findUnique.mockResolvedValue({
        ...mockQuote,
        isAccepted: true,
      });

      await expect(
        service.declineQuote(MOCK_BUYER_ID, MOCK_QUOTE_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent quote', async () => {
      prisma.rfqQuote.findUnique.mockResolvedValue(null);

      await expect(
        service.declineQuote(MOCK_BUYER_ID, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
