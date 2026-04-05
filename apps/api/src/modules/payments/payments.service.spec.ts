import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  UserRole,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PaymentsService } from './payments.service';
import { PrismaService } from '@/common/prisma/prisma.service';

// ---------------------------------------------------------------------------
// Stripe mock
// ---------------------------------------------------------------------------

const mockStripePaymentIntentsCreate = jest.fn();
const mockStripeRefundsCreate = jest.fn();
const mockStripeWebhooksConstructEvent = jest.fn();

jest.mock('stripe', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      paymentIntents: {
        create: mockStripePaymentIntentsCreate,
      },
      refunds: {
        create: mockStripeRefundsCreate,
      },
      webhooks: {
        constructEvent: mockStripeWebhooksConstructEvent,
      },
    })),
  };
});

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------

const mockPrisma = {
  payment: {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  order: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  vendorPayout: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

// Helper to simulate prisma.$transaction executing the callback
function setupTransactionPassthrough(): void {
  mockPrisma.$transaction.mockImplementation(
    async (callback: (tx: typeof mockPrisma) => Promise<unknown>) => {
      return callback(mockPrisma);
    },
  );
}

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function makePayment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'payment-1',
    orderId: 'order-1',
    method: PaymentMethod.STRIPE_CARD,
    status: PaymentStatus.PENDING,
    amount: new Decimal('100.00'),
    currency: 'USD',
    stripePaymentId: null,
    stripeChargeId: null,
    bankReference: null,
    bankProofUrl: null,
    escrowReleasedAt: null,
    paidAt: null,
    failedAt: null,
    failureReason: null,
    refundedAmount: new Decimal('0.00'),
    refundedAt: null,
    metadata: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    orderNumber: 'LM-20260101-AAAA',
    buyerId: 'buyer-1',
    status: OrderStatus.PENDING,
    subtotal: new Decimal('100.00'),
    shippingCost: new Decimal('0.00'),
    taxAmount: new Decimal('0.00'),
    discountAmount: new Decimal('0.00'),
    totalAmount: new Decimal('100.00'),
    currency: 'USD',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    setupTransactionPassthrough();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'stripe.secretKey': 'sk_test_123',
                'stripe.webhookSecret': 'whsec_test_123',
              };
              return config[key] ?? '';
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  // =========================================================================
  // createPaymentIntent
  // =========================================================================

  describe('createPaymentIntent', () => {
    it('should create a Stripe payment intent for STRIPE_CARD', async () => {
      const payment = makePayment({ method: PaymentMethod.STRIPE_CARD });
      const order = makeOrder({ payment });

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockStripePaymentIntentsCreate.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret_abc',
      });
      mockPrisma.payment.update.mockResolvedValue({
        ...payment,
        stripePaymentId: 'pi_test_123',
        status: PaymentStatus.PROCESSING,
      });

      const result = await service.createPaymentIntent('buyer-1', {
        orderId: 'order-1',
      });

      expect(mockStripePaymentIntentsCreate).toHaveBeenCalledWith({
        amount: 10000, // $100.00 -> 10000 cents
        currency: 'usd',
        metadata: { paymentId: 'payment-1' },
        automatic_payment_methods: { enabled: true },
      });
      expect(result.stripeClientSecret).toBe('pi_test_123_secret_abc');
      expect(result.status).toBe(PaymentStatus.PROCESSING);
    });

    it('should handle BANK_TRANSFER by returning payment in PENDING status', async () => {
      const payment = makePayment({
        method: PaymentMethod.BANK_TRANSFER,
      });
      const order = makeOrder({ payment });

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.payment.findUniqueOrThrow.mockResolvedValue(payment);

      const result = await service.createPaymentIntent('buyer-1', {
        orderId: 'order-1',
      });

      expect(mockStripePaymentIntentsCreate).not.toHaveBeenCalled();
      expect(result.status).toBe(PaymentStatus.PENDING);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.createPaymentIntent('buyer-1', {
          orderId: 'nonexistent',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when buyer does not own the order', async () => {
      const payment = makePayment();
      const order = makeOrder({ buyerId: 'other-buyer', payment });

      mockPrisma.order.findUnique.mockResolvedValue(order);

      await expect(
        service.createPaymentIntent('buyer-1', {
          orderId: 'order-1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when order is not PENDING', async () => {
      const payment = makePayment();
      const order = makeOrder({
        status: OrderStatus.CONFIRMED,
        payment,
      });

      mockPrisma.order.findUnique.mockResolvedValue(order);

      await expect(
        service.createPaymentIntent('buyer-1', {
          orderId: 'order-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // handleStripeWebhook
  // =========================================================================

  describe('handleStripeWebhook', () => {
    it('should handle payment_intent.succeeded', async () => {
      const payment = makePayment({
        stripePaymentId: 'pi_test_123',
        status: PaymentStatus.PROCESSING,
      });

      mockStripeWebhooksConstructEvent.mockReturnValue({
        id: 'evt_1',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            latest_charge: 'ch_test_123',
          },
        },
      });

      mockPrisma.payment.findFirst.mockResolvedValue(payment);
      mockPrisma.payment.update.mockResolvedValue({
        ...payment,
        status: PaymentStatus.COMPLETED,
      });
      mockPrisma.order.update.mockResolvedValue({});

      // For calculateVendorPayouts
      mockPrisma.payment.findUnique.mockResolvedValue({
        ...payment,
        order: {
          items: [
            {
              vendorId: 'vendor-1',
              totalPrice: new Decimal('100.00'),
              currency: 'USD',
              product: { category: { commission: null } },
              vendor: {
                vendorProfile: {
                  commissionRate: new Decimal('5.00'),
                },
              },
            },
          ],
        },
      });
      mockPrisma.vendorPayout.count.mockResolvedValue(0);
      mockPrisma.vendorPayout.createMany.mockResolvedValue({ count: 1 });

      await service.handleStripeWebhook(
        'sig_test',
        Buffer.from('payload'),
      );

      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'payment-1' },
          data: expect.objectContaining({
            status: PaymentStatus.COMPLETED,
          }),
        }),
      );
    });

    it('should handle payment_intent.payment_failed', async () => {
      const payment = makePayment({
        stripePaymentId: 'pi_test_fail',
        status: PaymentStatus.PROCESSING,
      });

      mockStripeWebhooksConstructEvent.mockReturnValue({
        id: 'evt_2',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_fail',
            last_payment_error: {
              message: 'Card declined',
            },
          },
        },
      });

      mockPrisma.payment.findFirst.mockResolvedValue(payment);
      mockPrisma.payment.update.mockResolvedValue({
        ...payment,
        status: PaymentStatus.FAILED,
      });

      await service.handleStripeWebhook(
        'sig_test',
        Buffer.from('payload'),
      );

      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PaymentStatus.FAILED,
            failureReason: 'Card declined',
          }),
        }),
      );
    });

    it('should skip already-completed payments (idempotency)', async () => {
      const payment = makePayment({
        stripePaymentId: 'pi_test_123',
        status: PaymentStatus.COMPLETED,
      });

      mockStripeWebhooksConstructEvent.mockReturnValue({
        id: 'evt_3',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            latest_charge: 'ch_test_123',
          },
        },
      });

      mockPrisma.payment.findFirst.mockResolvedValue(payment);

      await service.handleStripeWebhook(
        'sig_test',
        Buffer.from('payload'),
      );

      // Should NOT update since it is already COMPLETED
      expect(mockPrisma.payment.update).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // confirmBankTransfer
  // =========================================================================

  describe('confirmBankTransfer', () => {
    it('should update payment with bank reference and set to PROCESSING', async () => {
      const payment = makePayment({
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PENDING,
        order: makeOrder({ buyerId: 'buyer-1' }),
      });

      mockPrisma.payment.findUnique.mockResolvedValue(payment);
      mockPrisma.payment.update.mockResolvedValue({
        ...payment,
        bankReference: 'REF-123',
        bankProofUrl: 'https://cdn.example.com/proof.pdf',
        status: PaymentStatus.PROCESSING,
      });

      const result = await service.confirmBankTransfer('buyer-1', {
        paymentId: 'payment-1',
        bankReference: 'REF-123',
        bankProofUrl: 'https://cdn.example.com/proof.pdf',
      });

      expect(result.status).toBe(PaymentStatus.PROCESSING);
      expect(result.bankReference).toBe('REF-123');
    });

    it('should throw ForbiddenException when not the order owner', async () => {
      const payment = makePayment({
        method: PaymentMethod.BANK_TRANSFER,
        order: makeOrder({ buyerId: 'other-buyer' }),
      });

      mockPrisma.payment.findUnique.mockResolvedValue(payment);

      await expect(
        service.confirmBankTransfer('buyer-1', {
          paymentId: 'payment-1',
          bankReference: 'REF-123',
          bankProofUrl: 'https://cdn.example.com/proof.pdf',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // =========================================================================
  // verifyBankTransfer
  // =========================================================================

  describe('verifyBankTransfer', () => {
    it('should approve bank transfer and set payment to COMPLETED', async () => {
      const payment = makePayment({
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PROCESSING,
        order: makeOrder(),
      });

      mockPrisma.payment.findUnique.mockResolvedValue(payment);
      mockPrisma.payment.update.mockResolvedValue({
        ...payment,
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
      });
      mockPrisma.order.update.mockResolvedValue({});

      // calculateVendorPayouts setup
      const paymentWithItems = {
        ...payment,
        order: {
          items: [
            {
              vendorId: 'vendor-1',
              totalPrice: new Decimal('100.00'),
              currency: 'USD',
              product: { category: { commission: null } },
              vendor: {
                vendorProfile: {
                  commissionRate: new Decimal('10.00'),
                },
              },
            },
          ],
        },
      };

      // Override findUnique for calculateVendorPayouts (called after approve)
      mockPrisma.payment.findUnique
        .mockResolvedValueOnce(payment) // first call in verifyBankTransfer
        .mockResolvedValueOnce(paymentWithItems); // second call in calculateVendorPayouts

      mockPrisma.vendorPayout.count.mockResolvedValue(0);
      mockPrisma.vendorPayout.createMany.mockResolvedValue({ count: 1 });

      const result = await service.verifyBankTransfer('admin-1', {
        paymentId: 'payment-1',
        action: 'approve',
      });

      expect(result.status).toBe(PaymentStatus.COMPLETED);
    });

    it('should reject bank transfer and set payment to FAILED', async () => {
      const payment = makePayment({
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PROCESSING,
        order: makeOrder(),
      });

      mockPrisma.payment.findUnique.mockResolvedValue(payment);
      mockPrisma.payment.update.mockResolvedValue({
        ...payment,
        status: PaymentStatus.FAILED,
        failureReason: 'Reference not found',
      });

      const result = await service.verifyBankTransfer('admin-1', {
        paymentId: 'payment-1',
        action: 'reject',
        note: 'Reference not found',
      });

      expect(result.status).toBe(PaymentStatus.FAILED);
    });
  });

  // =========================================================================
  // processRefund
  // =========================================================================

  describe('processRefund', () => {
    it('should process a full refund for Stripe payment', async () => {
      const payment = makePayment({
        status: PaymentStatus.COMPLETED,
        stripePaymentId: 'pi_test_123',
        order: makeOrder(),
      });

      mockPrisma.payment.findUnique.mockResolvedValue(payment);
      mockStripeRefundsCreate.mockResolvedValue({ id: 're_test_123' });
      mockPrisma.payment.update.mockResolvedValue({
        ...payment,
        refundedAmount: new Decimal('100.00'),
        status: PaymentStatus.REFUNDED,
      });
      mockPrisma.order.update.mockResolvedValue({});

      const result = await service.processRefund('admin-1', {
        paymentId: 'payment-1',
        amount: 100,
        reason: 'Product defective',
      });

      expect(mockStripeRefundsCreate).toHaveBeenCalledWith({
        payment_intent: 'pi_test_123',
        amount: 10000, // 100 * 100
      });
      expect(result.status).toBe(PaymentStatus.REFUNDED);
    });

    it('should process a partial refund', async () => {
      const payment = makePayment({
        status: PaymentStatus.COMPLETED,
        stripePaymentId: 'pi_test_123',
        order: makeOrder(),
      });

      mockPrisma.payment.findUnique.mockResolvedValue(payment);
      mockStripeRefundsCreate.mockResolvedValue({ id: 're_test_456' });
      mockPrisma.payment.update.mockResolvedValue({
        ...payment,
        refundedAmount: new Decimal('30.00'),
        status: PaymentStatus.PARTIALLY_REFUNDED,
      });

      const result = await service.processRefund('admin-1', {
        paymentId: 'payment-1',
        amount: 30,
        reason: 'Partial damage',
      });

      expect(mockStripeRefundsCreate).toHaveBeenCalledWith({
        payment_intent: 'pi_test_123',
        amount: 3000,
      });
      expect(result.status).toBe(PaymentStatus.PARTIALLY_REFUNDED);
    });

    it('should throw when refund exceeds payment amount', async () => {
      const payment = makePayment({
        status: PaymentStatus.COMPLETED,
        refundedAmount: new Decimal('80.00'),
        order: makeOrder(),
      });

      mockPrisma.payment.findUnique.mockResolvedValue(payment);

      await expect(
        service.processRefund('admin-1', {
          paymentId: 'payment-1',
          amount: 30,
          reason: 'Too much',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when Stripe refund API fails', async () => {
      const payment = makePayment({
        status: PaymentStatus.COMPLETED,
        stripePaymentId: 'pi_test_123',
        order: makeOrder(),
      });

      mockPrisma.payment.findUnique.mockResolvedValue(payment);
      mockStripeRefundsCreate.mockRejectedValue(
        new Error('Stripe refund failed'),
      );

      await expect(
        service.processRefund('admin-1', {
          paymentId: 'payment-1',
          amount: 50,
          reason: 'Test',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  // =========================================================================
  // calculateVendorPayouts
  // =========================================================================

  describe('calculateVendorPayouts (via verifyBankTransfer)', () => {
    it('should calculate payouts correctly with commission deducted', async () => {
      const payment = makePayment({
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PROCESSING,
        order: makeOrder(),
      });

      // First call: verifyBankTransfer
      mockPrisma.payment.findUnique.mockResolvedValueOnce(payment);
      mockPrisma.payment.update.mockResolvedValue({
        ...payment,
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
      });
      mockPrisma.order.update.mockResolvedValue({});

      // Second call: calculateVendorPayouts
      mockPrisma.payment.findUnique.mockResolvedValueOnce({
        ...payment,
        order: {
          items: [
            {
              vendorId: 'vendor-1',
              totalPrice: new Decimal('200.00'),
              currency: 'USD',
              product: { category: { commission: null } },
              vendor: {
                vendorProfile: {
                  commissionRate: new Decimal('8.00'),
                },
              },
            },
          ],
        },
      });
      mockPrisma.vendorPayout.count.mockResolvedValue(0);
      mockPrisma.vendorPayout.createMany.mockResolvedValue({ count: 1 });

      await service.verifyBankTransfer('admin-1', {
        paymentId: 'payment-1',
        action: 'approve',
      });

      // Commission: 200 * 8% = 16
      // Vendor amount: 200 - 16 = 184
      expect(mockPrisma.vendorPayout.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            vendorId: 'vendor-1',
            amount: new Decimal('184.00'),
            commission: new Decimal('16.00'),
            commissionRate: new Decimal('8.00'),
            currency: 'USD',
            status: 'pending',
          }),
        ],
      });
    });

    it('should handle multi-vendor orders with different commission rates', async () => {
      const payment = makePayment({
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PROCESSING,
        order: makeOrder(),
      });

      mockPrisma.payment.findUnique.mockResolvedValueOnce(payment);
      mockPrisma.payment.update.mockResolvedValue({
        ...payment,
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
      });
      mockPrisma.order.update.mockResolvedValue({});

      mockPrisma.payment.findUnique.mockResolvedValueOnce({
        ...payment,
        order: {
          items: [
            {
              vendorId: 'vendor-1',
              totalPrice: new Decimal('150.00'),
              currency: 'USD',
              product: { category: { commission: new Decimal('12.00') } },
              vendor: {
                vendorProfile: {
                  commissionRate: new Decimal('5.00'),
                },
              },
            },
            {
              vendorId: 'vendor-2',
              totalPrice: new Decimal('50.00'),
              currency: 'USD',
              product: { category: { commission: null } },
              vendor: {
                vendorProfile: {
                  commissionRate: new Decimal('5.00'),
                },
              },
            },
          ],
        },
      });
      mockPrisma.vendorPayout.count.mockResolvedValue(0);
      mockPrisma.vendorPayout.createMany.mockResolvedValue({ count: 2 });

      await service.verifyBankTransfer('admin-1', {
        paymentId: 'payment-1',
        action: 'approve',
      });

      expect(mockPrisma.vendorPayout.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            vendorId: 'vendor-1',
            // Category commission override: 12%
            // Commission: 150 * 12% = 18
            // Vendor amount: 150 - 18 = 132
            amount: new Decimal('132.00'),
            commission: new Decimal('18.00'),
            commissionRate: new Decimal('12.00'),
          }),
          expect.objectContaining({
            vendorId: 'vendor-2',
            // Vendor profile rate: 5%
            // Commission: 50 * 5% = 2.50
            // Vendor amount: 50 - 2.50 = 47.50
            amount: new Decimal('47.50'),
            commission: new Decimal('2.50'),
            commissionRate: new Decimal('5.00'),
          }),
        ]),
      });
    });

    it('should not create duplicate payouts (idempotency)', async () => {
      const payment = makePayment({
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PROCESSING,
        order: makeOrder(),
      });

      mockPrisma.payment.findUnique.mockResolvedValueOnce(payment);
      mockPrisma.payment.update.mockResolvedValue({
        ...payment,
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
      });
      mockPrisma.order.update.mockResolvedValue({});

      mockPrisma.payment.findUnique.mockResolvedValueOnce({
        ...payment,
        order: { items: [] },
      });
      // Payouts already exist
      mockPrisma.vendorPayout.count.mockResolvedValue(2);

      await service.verifyBankTransfer('admin-1', {
        paymentId: 'payment-1',
        action: 'approve',
      });

      expect(mockPrisma.vendorPayout.createMany).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // getPaymentByOrderId
  // =========================================================================

  describe('getPaymentByOrderId', () => {
    it('should return payment for the order owner', async () => {
      const payment = makePayment({
        order: makeOrder({ buyerId: 'buyer-1', items: [] }),
      });

      mockPrisma.payment.findUnique.mockResolvedValue(payment);

      const result = await service.getPaymentByOrderId(
        'order-1',
        'buyer-1',
        UserRole.BUYER,
      );

      expect(result.id).toBe('payment-1');
    });

    it('should throw ForbiddenException for unauthorized access', async () => {
      const payment = makePayment({
        order: makeOrder({
          buyerId: 'other-buyer',
          items: [{ vendorId: 'vendor-2' }],
        }),
      });

      mockPrisma.payment.findUnique.mockResolvedValue(payment);

      await expect(
        service.getPaymentByOrderId('order-1', 'buyer-1', UserRole.BUYER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin access to any payment', async () => {
      const payment = makePayment({
        order: makeOrder({ buyerId: 'other-buyer', items: [] }),
      });

      mockPrisma.payment.findUnique.mockResolvedValue(payment);

      const result = await service.getPaymentByOrderId(
        'order-1',
        'admin-1',
        UserRole.ADMIN,
      );

      expect(result.id).toBe('payment-1');
    });
  });

  // =========================================================================
  // processVendorPayout
  // =========================================================================

  describe('processVendorPayout', () => {
    it('should mark a pending payout as completed', async () => {
      const payout = {
        id: 'payout-1',
        paymentId: 'payment-1',
        vendorId: 'vendor-1',
        amount: new Decimal('95.00'),
        commission: new Decimal('5.00'),
        commissionRate: new Decimal('5.00'),
        currency: 'USD',
        status: 'pending',
        bankReference: null,
        paidAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.vendorPayout.findUnique.mockResolvedValue(payout);
      mockPrisma.vendorPayout.update.mockResolvedValue({
        ...payout,
        status: 'completed',
        bankReference: 'BANK-REF-001',
        paidAt: new Date(),
      });

      const result = await service.processVendorPayout(
        'payout-1',
        'admin-1',
        'BANK-REF-001',
      );

      expect(result.status).toBe('completed');
      expect(result.bankReference).toBe('BANK-REF-001');
    });

    it('should throw BadRequestException for non-pending payout', async () => {
      const payout = {
        id: 'payout-1',
        status: 'completed',
      };

      mockPrisma.vendorPayout.findUnique.mockResolvedValue(payout);

      await expect(
        service.processVendorPayout('payout-1', 'admin-1', 'REF'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
