import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import Stripe from 'stripe';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AppConfig } from '@/config/configuration';
import {
  CreatePaymentIntentDto,
  PaymentResponseDto,
  ConfirmBankTransferDto,
  AdminVerifyBankTransferDto,
  ProcessRefundDto,
  VendorPayoutResponseDto,
  QueryPaymentsDto,
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

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {
    this.stripe = new Stripe(
      this.configService.get('stripe.secretKey', { infer: true }),
      { apiVersion: '2025-02-24.acacia' },
    );
  }

  // ---------------------------------------------------------------------------
  // CREATE PAYMENT INTENT
  // ---------------------------------------------------------------------------

  async createPaymentIntent(
    buyerId: string,
    dto: CreatePaymentIntentDto,
  ): Promise<PaymentResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException(
        `Order with ID "${dto.orderId}" not found`,
      );
    }

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('You can only pay for your own orders');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Order is not in PENDING status. Current status: ${order.status}`,
      );
    }

    const payment = order.payment;
    if (!payment) {
      throw new NotFoundException(
        `No payment record found for order "${dto.orderId}"`,
      );
    }

    if (
      payment.status === PaymentStatus.COMPLETED ||
      payment.status === PaymentStatus.PROCESSING
    ) {
      throw new BadRequestException(
        `Payment is already ${payment.status}. Cannot create a new intent.`,
      );
    }

    const amountDecimal = new Decimal(order.totalAmount.toString());
    const currency = order.currency.toLowerCase();

    if (payment.method === PaymentMethod.STRIPE_CARD) {
      return this.handleStripePaymentIntent(payment.id, amountDecimal, currency);
    }

    if (payment.method === PaymentMethod.BANK_TRANSFER) {
      return this.handleBankTransferIntent(payment.id);
    }

    if (payment.method === PaymentMethod.ESCROW) {
      return this.handleStripePaymentIntent(payment.id, amountDecimal, currency);
    }

    throw new BadRequestException(
      `Unsupported payment method: ${payment.method}`,
    );
  }

  // ---------------------------------------------------------------------------
  // STRIPE WEBHOOK
  // ---------------------------------------------------------------------------

  async handleStripeWebhook(
    signature: string,
    payload: Buffer,
  ): Promise<void> {
    const webhookSecret = this.configService.get('stripe.webhookSecret', {
      infer: true,
    });

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unknown webhook error';
      this.logger.error(`Stripe webhook signature verification failed: ${message}`);
      throw new BadRequestException(
        `Webhook signature verification failed: ${message}`,
      );
    }

    this.logger.log(`Processing Stripe webhook event: ${event.type} (${event.id})`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
          event.id,
        );
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case 'charge.refunded':
        await this.handleChargeRefunded(
          event.data.object as Stripe.Charge,
        );
        break;

      default:
        this.logger.log(`Unhandled Stripe event type: ${event.type}`);
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // BANK TRANSFER: BUYER CONFIRMS
  // ---------------------------------------------------------------------------

  async confirmBankTransfer(
    buyerId: string,
    dto: ConfirmBankTransferDto,
  ): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment with ID "${dto.paymentId}" not found`,
      );
    }

    if (payment.order.buyerId !== buyerId) {
      throw new ForbiddenException(
        'You can only confirm bank transfers for your own orders',
      );
    }

    if (payment.method !== PaymentMethod.BANK_TRANSFER) {
      throw new BadRequestException(
        'This payment is not a bank transfer',
      );
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        `Payment is in status "${payment.status}" and cannot be confirmed`,
      );
    }

    const updated = await this.prisma.payment.update({
      where: { id: dto.paymentId },
      data: {
        bankReference: dto.bankReference,
        bankProofUrl: dto.bankProofUrl,
        status: PaymentStatus.PROCESSING,
      },
    });

    this.logger.log(
      `Bank transfer confirmed by buyer for payment ${dto.paymentId}, reference: ${dto.bankReference}`,
    );

    return PaymentResponseDto.fromEntity(updated);
  }

  // ---------------------------------------------------------------------------
  // BANK TRANSFER: ADMIN VERIFIES
  // ---------------------------------------------------------------------------

  async verifyBankTransfer(
    adminId: string,
    dto: AdminVerifyBankTransferDto,
  ): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment with ID "${dto.paymentId}" not found`,
      );
    }

    if (payment.status !== PaymentStatus.PROCESSING) {
      throw new BadRequestException(
        `Payment is in status "${payment.status}". Only PROCESSING payments can be verified.`,
      );
    }

    if (dto.action === 'approve') {
      const updated = await this.prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: { id: dto.paymentId },
          data: {
            status: PaymentStatus.COMPLETED,
            paidAt: new Date(),
            metadata: JSON.stringify({
              verifiedBy: adminId,
              verifiedAt: new Date().toISOString(),
              note: dto.note ?? null,
            }),
          },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.CONFIRMED },
        });

        return updatedPayment;
      });

      await this.calculateVendorPayouts(updated.id);

      this.logger.log(
        `Bank transfer approved by admin ${adminId} for payment ${dto.paymentId}`,
      );

      return PaymentResponseDto.fromEntity(updated);
    }

    // Reject
    const updated = await this.prisma.payment.update({
      where: { id: dto.paymentId },
      data: {
        status: PaymentStatus.FAILED,
        failedAt: new Date(),
        failureReason: dto.note ?? 'Bank transfer rejected by admin',
        metadata: JSON.stringify({
          rejectedBy: adminId,
          rejectedAt: new Date().toISOString(),
          note: dto.note ?? null,
        }),
      },
    });

    this.logger.log(
      `Bank transfer rejected by admin ${adminId} for payment ${dto.paymentId}: ${dto.note ?? 'No reason provided'}`,
    );

    return PaymentResponseDto.fromEntity(updated);
  }

  // ---------------------------------------------------------------------------
  // REFUND
  // ---------------------------------------------------------------------------

  async processRefund(
    adminId: string,
    dto: ProcessRefundDto,
  ): Promise<PaymentResponseDto> {
    const updated = await this.prisma.$transaction(async (tx) => {
      // Read payment inside transaction for consistency
      const payment = await tx.payment.findUnique({
        where: { id: dto.paymentId },
        include: { order: true },
      });

      if (!payment) {
        throw new NotFoundException(
          `Payment with ID "${dto.paymentId}" not found`,
        );
      }

      if (payment.status !== PaymentStatus.COMPLETED &&
          payment.status !== PaymentStatus.PARTIALLY_REFUNDED) {
        throw new BadRequestException(
          `Cannot refund a payment with status "${payment.status}". Payment must be COMPLETED or PARTIALLY_REFUNDED.`,
        );
      }

      const refundAmount = new Decimal(dto.amount.toString());
      const currentRefundedAmount = new Decimal(payment.refundedAmount.toString());
      const paymentAmount = new Decimal(payment.amount.toString());
      const totalAfterRefund = currentRefundedAmount.add(refundAmount);

      if (totalAfterRefund.greaterThan(paymentAmount)) {
        throw new BadRequestException(
          `Refund amount (${refundAmount.toFixed(2)}) would exceed the total payment amount. ` +
          `Already refunded: ${currentRefundedAmount.toFixed(2)}, payment total: ${paymentAmount.toFixed(2)}`,
        );
      }

      // For Stripe payments, create a refund via API
      if (
        payment.method === PaymentMethod.STRIPE_CARD ||
        payment.method === PaymentMethod.ESCROW
      ) {
        if (!payment.stripePaymentId) {
          throw new UnprocessableEntityException(
            'Cannot process Stripe refund: no Stripe payment ID on record',
          );
        }

        try {
          await this.stripe.refunds.create({
            payment_intent: payment.stripePaymentId,
            amount: this.toStripeAmount(refundAmount, payment.currency),
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Unknown Stripe error';
          this.logger.error(
            `Stripe refund failed for payment ${dto.paymentId}: ${message}`,
          );
          throw new UnprocessableEntityException(
            `Stripe refund failed: ${message}`,
          );
        }
      }

      const isFullRefund = totalAfterRefund.equals(paymentAmount);
      const newStatus = isFullRefund
        ? PaymentStatus.REFUNDED
        : PaymentStatus.PARTIALLY_REFUNDED;

      // Optimistic lock: only update if refundedAmount hasn't changed concurrently
      const updateResult = await tx.payment.updateMany({
        where: {
          id: dto.paymentId,
          refundedAmount: currentRefundedAmount, // optimistic lock
        },
        data: {
          refundedAmount: totalAfterRefund,
          refundedAt: new Date(),
          status: newStatus,
          metadata: JSON.stringify({
            lastRefundBy: adminId,
            lastRefundAt: new Date().toISOString(),
            lastRefundReason: dto.reason,
            lastRefundAmount: refundAmount.toFixed(2),
          }),
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          'Payment was modified concurrently. Please retry.',
        );
      }

      if (isFullRefund) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.REFUNDED },
        });
      }

      return tx.payment.findUniqueOrThrow({
        where: { id: dto.paymentId },
      });
    });

    this.logger.log(
      `Refund processed by admin ${adminId}: payment ${dto.paymentId}, amount: ${new Decimal(dto.amount.toString()).toFixed(2)}, ` +
      `status: ${updated.status}`,
    );

    return PaymentResponseDto.fromEntity(updated);
  }

  // ---------------------------------------------------------------------------
  // GET PAYMENT BY ORDER ID
  // ---------------------------------------------------------------------------

  async getPaymentByOrderId(
    orderId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: {
        order: {
          include: { items: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment for order "${orderId}" not found`,
      );
    }

    this.assertPaymentAccess(payment, userId, userRole);

    return PaymentResponseDto.fromEntity(payment);
  }

  // ---------------------------------------------------------------------------
  // LIST PAYMENTS (ADMIN)
  // ---------------------------------------------------------------------------

  async listPayments(
    query: QueryPaymentsDto,
  ): Promise<PaginatedResponse<PaymentResponseDto>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.method) {
      where.method = query.method;
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

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: payments.map((p) => PaymentResponseDto.fromEntity(p)),
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
  // LIST VENDOR PAYOUTS
  // ---------------------------------------------------------------------------

  async listVendorPayouts(
    vendorId: string,
    query: QueryPaymentsDto,
  ): Promise<PaginatedResponse<VendorPayoutResponseDto>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.VendorPayoutWhereInput = { vendorId };

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

    const [payouts, total] = await Promise.all([
      this.prisma.vendorPayout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vendorPayout.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: payouts.map((p) => VendorPayoutResponseDto.fromEntity(p)),
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
  // PROCESS VENDOR PAYOUT (ADMIN)
  // ---------------------------------------------------------------------------

  async processVendorPayout(
    payoutId: string,
    adminId: string,
    bankReference: string,
  ): Promise<VendorPayoutResponseDto> {
    const payout = await this.prisma.vendorPayout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException(
        `Vendor payout with ID "${payoutId}" not found`,
      );
    }

    if (payout.status !== 'pending') {
      throw new BadRequestException(
        `Payout is in status "${payout.status}". Only pending payouts can be processed.`,
      );
    }

    const updated = await this.prisma.vendorPayout.update({
      where: { id: payoutId },
      data: {
        status: 'completed',
        bankReference,
        paidAt: new Date(),
      },
    });

    this.logger.log(
      `Vendor payout ${payoutId} processed by admin ${adminId}, bank ref: ${bankReference}`,
    );

    return VendorPayoutResponseDto.fromEntity(updated);
  }

  // ---------------------------------------------------------------------------
  // PRIVATE: STRIPE PAYMENT INTENT HANDLING
  // ---------------------------------------------------------------------------

  private async handleStripePaymentIntent(
    paymentId: string,
    amount: Decimal,
    currency: string,
  ): Promise<PaymentResponseDto> {
    const stripeAmount = this.toStripeAmount(amount, currency);

    let paymentIntent: Stripe.PaymentIntent;

    try {
      paymentIntent = await this.stripe.paymentIntents.create({
        amount: stripeAmount,
        currency,
        metadata: { paymentId },
        automatic_payment_methods: { enabled: true },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unknown Stripe error';
      this.logger.error(
        `Failed to create Stripe PaymentIntent for payment ${paymentId}: ${message}`,
      );
      throw new UnprocessableEntityException(
        `Failed to create payment intent: ${message}`,
      );
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        stripePaymentId: paymentIntent.id,
        status: PaymentStatus.PROCESSING,
      },
    });

    this.logger.log(
      `Stripe PaymentIntent created: ${paymentIntent.id} for payment ${paymentId}`,
    );

    return PaymentResponseDto.fromEntity(updated, paymentIntent.client_secret);
  }

  // ---------------------------------------------------------------------------
  // PRIVATE: BANK TRANSFER INTENT HANDLING
  // ---------------------------------------------------------------------------

  private async handleBankTransferIntent(
    paymentId: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUniqueOrThrow({
      where: { id: paymentId },
    });

    // Payment stays PENDING until buyer submits proof
    this.logger.log(
      `Bank transfer intent created for payment ${paymentId}. Awaiting buyer confirmation.`,
    );

    return PaymentResponseDto.fromEntity(payment);
  }

  // ---------------------------------------------------------------------------
  // PRIVATE: WEBHOOK EVENT HANDLERS
  // ---------------------------------------------------------------------------

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
    eventId: string,
  ): Promise<void> {
    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (!payment) {
      this.logger.warn(
        `No payment found for Stripe PaymentIntent ${paymentIntent.id}`,
      );
      return;
    }

    // Idempotency: skip if already completed
    if (payment.status === PaymentStatus.COMPLETED) {
      this.logger.log(
        `Payment ${payment.id} already COMPLETED. Skipping webhook event ${eventId}.`,
      );
      return;
    }

    const chargeId =
      typeof paymentIntent.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : paymentIntent.latest_charge?.id ?? null;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          stripeChargeId: chargeId,
          paidAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.CONFIRMED },
      });
    });

    await this.calculateVendorPayouts(payment.id);

    this.logger.log(
      `Payment ${payment.id} marked COMPLETED via Stripe webhook (PI: ${paymentIntent.id})`,
    );
  }

  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (!payment) {
      this.logger.warn(
        `No payment found for failed Stripe PaymentIntent ${paymentIntent.id}`,
      );
      return;
    }

    // Idempotency: skip if already in a terminal state
    if (
      payment.status === PaymentStatus.FAILED ||
      payment.status === PaymentStatus.COMPLETED
    ) {
      this.logger.log(
        `Payment ${payment.id} already in terminal status ${payment.status}. Skipping.`,
      );
      return;
    }

    const failureMessage =
      paymentIntent.last_payment_error?.message ?? 'Payment failed';

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        failedAt: new Date(),
        failureReason: failureMessage,
      },
    });

    this.logger.log(
      `Payment ${payment.id} marked FAILED via Stripe webhook (PI: ${paymentIntent.id}): ${failureMessage}`,
    );
  }

  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    const paymentIntentId =
      typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id ?? null;

    if (!paymentIntentId) {
      this.logger.warn(
        `Charge refunded event with no payment_intent ID. Charge: ${charge.id}`,
      );
      return;
    }

    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentId: paymentIntentId },
    });

    if (!payment) {
      this.logger.warn(
        `No payment found for refunded charge (PI: ${paymentIntentId})`,
      );
      return;
    }

    const refundedCents = charge.amount_refunded;
    const refundedAmount = this.fromStripeAmount(refundedCents, payment.currency);
    const paymentAmount = new Decimal(payment.amount.toString());
    const isFullRefund = refundedAmount.equals(paymentAmount);

    const newStatus = isFullRefund
      ? PaymentStatus.REFUNDED
      : PaymentStatus.PARTIALLY_REFUNDED;

    // Idempotency: check if we already recorded this refund amount
    const currentRefunded = new Decimal(payment.refundedAmount.toString());
    if (currentRefunded.equals(refundedAmount)) {
      this.logger.log(
        `Refund amount for payment ${payment.id} already matches. Skipping.`,
      );
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          refundedAmount: refundedAmount,
          refundedAt: new Date(),
          status: newStatus,
        },
      });

      if (isFullRefund) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.REFUNDED },
        });
      }
    });

    this.logger.log(
      `Charge refund processed for payment ${payment.id}: refunded ${refundedAmount.toFixed(2)}, status: ${newStatus}`,
    );
  }

  // ---------------------------------------------------------------------------
  // PRIVATE: CALCULATE VENDOR PAYOUTS
  // ---------------------------------------------------------------------------

  private async calculateVendorPayouts(paymentId: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    category: true,
                  },
                },
                vendor: {
                  include: {
                    vendorProfile: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      this.logger.error(
        `Cannot calculate payouts: payment ${paymentId} not found`,
      );
      return;
    }

    // Check if payouts already exist (idempotency)
    const existingPayouts = await this.prisma.vendorPayout.count({
      where: { paymentId },
    });

    if (existingPayouts > 0) {
      this.logger.log(
        `Payouts already calculated for payment ${paymentId}. Skipping.`,
      );
      return;
    }

    // Aggregate totals per vendor
    const vendorTotals = new Map<
      string,
      { totalPrice: Decimal; commissionRate: Decimal; currency: string }
    >();

    for (const item of payment.order.items) {
      const vendorId = item.vendorId;
      const itemTotal = new Decimal(item.totalPrice.toString());

      // Commission priority: category override > vendor profile rate > default 5%
      let commissionRate: Decimal;

      if (
        item.product?.category?.commission !== null &&
        item.product?.category?.commission !== undefined
      ) {
        commissionRate = new Decimal(
          item.product.category.commission.toString(),
        );
      } else if (item.vendor?.vendorProfile?.commissionRate !== undefined) {
        commissionRate = new Decimal(
          item.vendor.vendorProfile.commissionRate.toString(),
        );
      } else {
        commissionRate = new Decimal('5.00');
      }

      const existing = vendorTotals.get(vendorId);

      if (existing) {
        // Use the higher commission rate if items have different rates
        vendorTotals.set(vendorId, {
          totalPrice: existing.totalPrice.add(itemTotal),
          commissionRate:
            commissionRate.greaterThan(existing.commissionRate)
              ? commissionRate
              : existing.commissionRate,
          currency: item.currency,
        });
      } else {
        vendorTotals.set(vendorId, {
          totalPrice: itemTotal,
          commissionRate,
          currency: item.currency,
        });
      }
    }

    // Create payout records
    const payoutData: Prisma.VendorPayoutCreateManyInput[] = [];

    for (const [vendorId, totals] of vendorTotals) {
      const commission = totals.totalPrice
        .mul(totals.commissionRate)
        .div(100)
        .toDecimalPlaces(2);
      const vendorAmount = totals.totalPrice.sub(commission).toDecimalPlaces(2);

      payoutData.push({
        paymentId,
        vendorId,
        amount: vendorAmount,
        commission,
        commissionRate: totals.commissionRate,
        currency: totals.currency,
        status: 'pending',
      });
    }

    if (payoutData.length > 0) {
      await this.prisma.vendorPayout.createMany({ data: payoutData });

      this.logger.log(
        `Created ${payoutData.length} vendor payout record(s) for payment ${paymentId}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // PRIVATE: HELPERS
  // ---------------------------------------------------------------------------

  /**
   * Convert a Decimal amount to Stripe's smallest currency unit (e.g. cents).
   * Zero-decimal currencies (JPY, KRW, etc.) are passed as-is.
   */
  private toStripeAmount(amount: Decimal, currency: string): number {
    const zeroDecimalCurrencies = new Set([
      'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga',
      'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
    ]);

    if (zeroDecimalCurrencies.has(currency.toLowerCase())) {
      return amount.toNumber();
    }

    return amount.mul(100).round().toNumber();
  }

  /**
   * Convert Stripe's smallest currency unit back to a Decimal.
   */
  private fromStripeAmount(amountInSmallest: number, currency: string): Decimal {
    const zeroDecimalCurrencies = new Set([
      'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga',
      'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
    ]);

    if (zeroDecimalCurrencies.has(currency.toLowerCase())) {
      return new Decimal(amountInSmallest);
    }

    return new Decimal(amountInSmallest).div(100);
  }

  private assertPaymentAccess(
    payment: {
      order: { buyerId: string; items?: { vendorId: string }[] };
    },
    userId: string,
    userRole: UserRole,
  ): void {
    if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) {
      return;
    }

    if (userRole === UserRole.BUYER && payment.order.buyerId === userId) {
      return;
    }

    if (userRole === UserRole.VENDOR) {
      const hasVendorItems = payment.order.items?.some(
        (item) => item.vendorId === userId,
      );
      if (hasVendorItems) return;
    }

    throw new ForbiddenException('You do not have access to this payment');
  }
}
