import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RfqStatus, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  CreateRfqDto,
  RfqResponseDto,
  CreateRfqQuoteDto,
  RfqQuoteResponseDto,
  QueryRfqsDto,
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

const RFQ_FULL_INCLUDE = {
  buyer: true,
  product: true,
  quotes: {
    include: {
      vendor: {
        include: {
          vendorProfile: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

const RFQ_QUOTE_INCLUDE = {
  vendor: {
    include: {
      vendorProfile: true,
    },
  },
} as const;

@Injectable()
export class RfqService {
  private readonly logger = new Logger(RfqService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // CREATE RFQ
  // ---------------------------------------------------------------------------

  async createRfq(
    buyerId: string,
    dto: CreateRfqDto,
  ): Promise<RfqResponseDto> {
    if (dto.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId, deletedAt: null },
      });
      if (!product) {
        throw new NotFoundException(
          `Product with ID "${dto.productId}" not found`,
        );
      }
    }

    const rfq = await this.prisma.rfq.create({
      data: {
        buyerId,
        productId: dto.productId,
        title: dto.title,
        description: dto.description,
        quantity: dto.quantity,
        unit: dto.unit,
        targetPrice: dto.targetPrice
          ? new Decimal(dto.targetPrice)
          : undefined,
        currency: dto.currency ?? 'USD',
        deliveryAddr: dto.deliveryAddress,
        requiredBy: dto.requiredBy ? new Date(dto.requiredBy) : undefined,
        attachments: dto.attachments
          ? JSON.stringify(dto.attachments)
          : undefined,
        status: RfqStatus.OPEN,
        expiresAt: new Date(dto.expiresAt),
      },
      include: RFQ_FULL_INCLUDE,
    });

    this.logger.log(`RFQ created: "${rfq.title}" (${rfq.id}) by buyer ${buyerId}`);
    return RfqResponseDto.fromEntity(rfq);
  }

  // ---------------------------------------------------------------------------
  // LIST RFQS
  // ---------------------------------------------------------------------------

  async listRfqs(
    userId: string,
    userRole: UserRole,
    query: QueryRfqsDto,
  ): Promise<PaginatedResponse<RfqResponseDto>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RfqWhereInput = {};

    if (userRole === UserRole.BUYER) {
      where.buyerId = userId;
    } else if (userRole === UserRole.VENDOR) {
      where.status = query.status ?? RfqStatus.OPEN;
    }

    if (
      query.status &&
      (userRole === UserRole.ADMIN ||
        userRole === UserRole.SUPER_ADMIN ||
        userRole === UserRole.BUYER)
    ) {
      where.status = query.status;
    }

    const [rfqs, total] = await Promise.all([
      this.prisma.rfq.findMany({
        where,
        include: RFQ_FULL_INCLUDE,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rfq.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: rfqs.map((r) => RfqResponseDto.fromEntity(r)),
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

  // ---------------------------------------------------------------------------
  // GET RFQ BY ID
  // ---------------------------------------------------------------------------

  async getRfqById(
    rfqId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<RfqResponseDto> {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id: rfqId },
      include: RFQ_FULL_INCLUDE,
    });

    if (!rfq) {
      throw new NotFoundException(`RFQ with ID "${rfqId}" not found`);
    }

    if (userRole === UserRole.BUYER && rfq.buyerId !== userId) {
      throw new ForbiddenException('You can only view your own RFQs');
    }

    return RfqResponseDto.fromEntity(rfq);
  }

  // ---------------------------------------------------------------------------
  // SUBMIT QUOTE
  // ---------------------------------------------------------------------------

  async submitQuote(
    vendorId: string,
    dto: CreateRfqQuoteDto,
  ): Promise<RfqQuoteResponseDto> {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id: dto.rfqId },
    });

    if (!rfq) {
      throw new NotFoundException(`RFQ with ID "${dto.rfqId}" not found`);
    }

    if (rfq.status !== RfqStatus.OPEN && rfq.status !== RfqStatus.QUOTED) {
      throw new BadRequestException(
        `Cannot submit a quote for an RFQ with status "${rfq.status}"`,
      );
    }

    if (new Date() > rfq.expiresAt) {
      throw new BadRequestException('This RFQ has expired');
    }

    const existingQuote = await this.prisma.rfqQuote.findUnique({
      where: {
        rfqId_vendorId: {
          rfqId: dto.rfqId,
          vendorId,
        },
      },
    });

    if (existingQuote) {
      throw new ConflictException(
        'You have already submitted a quote for this RFQ',
      );
    }

    const quote = await this.prisma.$transaction(async (tx) => {
      const created = await tx.rfqQuote.create({
        data: {
          rfqId: dto.rfqId,
          vendorId,
          unitPrice: new Decimal(dto.unitPrice),
          totalPrice: new Decimal(dto.totalPrice),
          currency: dto.currency,
          leadTimeDays: dto.leadTimeDays,
          validUntil: new Date(dto.validUntil),
          notes: dto.notes,
          attachments: dto.attachments
            ? JSON.stringify(dto.attachments)
            : undefined,
        },
        include: RFQ_QUOTE_INCLUDE,
      });

      if (rfq.status === RfqStatus.OPEN) {
        await tx.rfq.update({
          where: { id: dto.rfqId },
          data: { status: RfqStatus.QUOTED },
        });
      }

      return created;
    });

    this.logger.log(
      `Quote submitted for RFQ ${dto.rfqId} by vendor ${vendorId}`,
    );
    return RfqQuoteResponseDto.fromEntity(quote);
  }

  // ---------------------------------------------------------------------------
  // ACCEPT QUOTE
  // ---------------------------------------------------------------------------

  async acceptQuote(
    buyerId: string,
    quoteId: string,
  ): Promise<RfqQuoteResponseDto> {
    const quote = await this.prisma.rfqQuote.findUnique({
      where: { id: quoteId },
      include: {
        rfq: true,
        ...RFQ_QUOTE_INCLUDE,
      },
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID "${quoteId}" not found`);
    }

    if (quote.rfq.buyerId !== buyerId) {
      throw new ForbiddenException(
        'You can only accept quotes on your own RFQs',
      );
    }

    if (
      quote.rfq.status === RfqStatus.ACCEPTED ||
      quote.rfq.status === RfqStatus.CONVERTED_TO_ORDER
    ) {
      throw new BadRequestException(
        'A quote has already been accepted for this RFQ',
      );
    }

    if (quote.isAccepted) {
      throw new BadRequestException('This quote has already been accepted');
    }

    const updatedQuote = await this.prisma.$transaction(async (tx) => {
      const accepted = await tx.rfqQuote.update({
        where: { id: quoteId },
        data: { isAccepted: true },
        include: RFQ_QUOTE_INCLUDE,
      });

      await tx.rfq.update({
        where: { id: quote.rfqId },
        data: { status: RfqStatus.ACCEPTED },
      });

      return accepted;
    });

    this.logger.log(
      `Quote ${quoteId} accepted by buyer ${buyerId} for RFQ ${quote.rfqId}`,
    );
    return RfqQuoteResponseDto.fromEntity(updatedQuote);
  }

  // ---------------------------------------------------------------------------
  // DECLINE QUOTE
  // ---------------------------------------------------------------------------

  async declineQuote(
    buyerId: string,
    quoteId: string,
  ): Promise<RfqQuoteResponseDto> {
    const quote = await this.prisma.rfqQuote.findUnique({
      where: { id: quoteId },
      include: {
        rfq: true,
        ...RFQ_QUOTE_INCLUDE,
      },
    });

    if (!quote) {
      throw new NotFoundException(`Quote with ID "${quoteId}" not found`);
    }

    if (quote.rfq.buyerId !== buyerId) {
      throw new ForbiddenException(
        'You can only decline quotes on your own RFQs',
      );
    }

    if (quote.isAccepted) {
      throw new BadRequestException(
        'Cannot decline an already accepted quote',
      );
    }

    const updatedQuote = await this.prisma.$transaction(async (tx) => {
      await tx.rfqQuote.delete({
        where: { id: quoteId },
      });

      const remainingQuotes = await tx.rfqQuote.count({
        where: { rfqId: quote.rfqId },
      });

      if (remainingQuotes === 0) {
        await tx.rfq.update({
          where: { id: quote.rfqId },
          data: { status: RfqStatus.OPEN },
        });
      }

      return quote;
    });

    this.logger.log(
      `Quote ${quoteId} declined by buyer ${buyerId} for RFQ ${quote.rfqId}`,
    );
    return RfqQuoteResponseDto.fromEntity(updatedQuote);
  }
}
