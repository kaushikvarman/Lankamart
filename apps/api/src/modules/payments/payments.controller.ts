import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  RawBody,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  CurrentUser,
  JwtPayload,
} from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { PaymentsService, PaginatedResponse } from './payments.service';
import {
  CreatePaymentIntentDto,
  PaymentResponseDto,
  ConfirmBankTransferDto,
  AdminVerifyBankTransferDto,
  ProcessRefundDto,
  VendorPayoutResponseDto,
  QueryPaymentsDto,
} from './dto';
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class ProcessPayoutBodyDto {
  @ApiProperty({ description: 'Bank reference for the payout transfer' })
  @IsString()
  @MinLength(3)
  bankReference!: string;
}

/**
 * Payments controller.
 *
 * NOTE: The Stripe webhook endpoint requires the raw (unparsed) request body
 * for signature verification. Ensure that `main.ts` bootstraps the NestJS app
 * with `rawBody: true`:
 *
 * ```ts
 * const app = await NestFactory.create<NestExpressApplication>(AppModule, {
 *   rawBody: true,
 * });
 * ```
 */
@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ---------------------------------------------------------------------------
  // CREATE PAYMENT INTENT
  // ---------------------------------------------------------------------------

  @Post('create-intent')
  @Roles(UserRole.BUYER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a payment intent for an order (buyer)' })
  @ApiCreatedResponse({
    description: 'Payment intent created',
    type: PaymentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid order state or method' })
  @ApiNotFoundResponse({ description: 'Order or payment not found' })
  @ApiForbiddenResponse({ description: 'Not the order owner' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnprocessableEntityResponse({
    description: 'Stripe error or payment processing failure',
  })
  async createIntent(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePaymentIntentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.createPaymentIntent(user.sub, dto);
  }

  // ---------------------------------------------------------------------------
  // STRIPE WEBHOOK
  // ---------------------------------------------------------------------------

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint (public, raw body)' })
  @ApiOkResponse({ description: 'Webhook processed' })
  @ApiBadRequestResponse({ description: 'Invalid webhook signature' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @RawBody() payload: Buffer,
  ): Promise<{ received: boolean }> {
    await this.paymentsService.handleStripeWebhook(signature, payload);
    return { received: true };
  }

  // ---------------------------------------------------------------------------
  // BANK TRANSFER: BUYER CONFIRMS
  // ---------------------------------------------------------------------------

  @Post('bank-transfer/confirm')
  @Roles(UserRole.BUYER)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Submit bank transfer proof (buyer)',
  })
  @ApiOkResponse({
    description: 'Bank transfer confirmation submitted',
    type: PaymentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid payment state or not a bank transfer',
  })
  @ApiNotFoundResponse({ description: 'Payment not found' })
  @ApiForbiddenResponse({ description: 'Not the order owner' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async confirmBankTransfer(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ConfirmBankTransferDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.confirmBankTransfer(user.sub, dto);
  }

  // ---------------------------------------------------------------------------
  // BANK TRANSFER: ADMIN VERIFIES
  // ---------------------------------------------------------------------------

  @Post('bank-transfer/verify')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Approve or reject a bank transfer (admin)',
  })
  @ApiOkResponse({
    description: 'Bank transfer verified',
    type: PaymentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid payment state' })
  @ApiNotFoundResponse({ description: 'Payment not found' })
  @ApiForbiddenResponse({
    description: 'Requires ADMIN or SUPER_ADMIN role',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async verifyBankTransfer(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AdminVerifyBankTransferDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.verifyBankTransfer(user.sub, dto);
  }

  // ---------------------------------------------------------------------------
  // REFUND
  // ---------------------------------------------------------------------------

  @Post('refund')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Process a full or partial refund (admin)' })
  @ApiOkResponse({
    description: 'Refund processed',
    type: PaymentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid payment state or amount' })
  @ApiNotFoundResponse({ description: 'Payment not found' })
  @ApiForbiddenResponse({
    description: 'Requires ADMIN or SUPER_ADMIN role',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiUnprocessableEntityResponse({
    description: 'Stripe refund failed',
  })
  async processRefund(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ProcessRefundDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.processRefund(user.sub, dto);
  }

  // ---------------------------------------------------------------------------
  // GET PAYMENT BY ORDER
  // ---------------------------------------------------------------------------

  @Get('order/:orderId')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get payment details for an order (owner/vendor/admin)',
  })
  @ApiOkResponse({
    description: 'Payment details',
    type: PaymentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Payment not found' })
  @ApiForbiddenResponse({ description: 'No access to this payment' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getPaymentByOrder(
    @CurrentUser() user: JwtPayload,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.getPaymentByOrderId(
      orderId,
      user.sub,
      user.role,
    );
  }

  // ---------------------------------------------------------------------------
  // LIST PAYMENTS (ADMIN)
  // ---------------------------------------------------------------------------

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all payments (admin)' })
  @ApiOkResponse({ description: 'Paginated list of payments' })
  @ApiForbiddenResponse({
    description: 'Requires ADMIN or SUPER_ADMIN role',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async listPayments(
    @Query() query: QueryPaymentsDto,
  ): Promise<PaginatedResponse<PaymentResponseDto>> {
    return this.paymentsService.listPayments(query);
  }

  // ---------------------------------------------------------------------------
  // LIST VENDOR PAYOUTS (VENDOR)
  // ---------------------------------------------------------------------------

  @Get('vendor-payouts')
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List my payout history (vendor)' })
  @ApiOkResponse({ description: 'Paginated list of vendor payouts' })
  @ApiForbiddenResponse({ description: 'Requires VENDOR role' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async listVendorPayouts(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryPaymentsDto,
  ): Promise<PaginatedResponse<VendorPayoutResponseDto>> {
    return this.paymentsService.listVendorPayouts(user.sub, query);
  }

  // ---------------------------------------------------------------------------
  // PROCESS VENDOR PAYOUT (ADMIN)
  // ---------------------------------------------------------------------------

  @Post('vendor-payouts/:id/process')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Mark vendor payout as processed (admin)',
  })
  @ApiOkResponse({
    description: 'Payout processed',
    type: VendorPayoutResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Payout not in pending status' })
  @ApiNotFoundResponse({ description: 'Payout not found' })
  @ApiForbiddenResponse({
    description: 'Requires ADMIN or SUPER_ADMIN role',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async processVendorPayout(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ProcessPayoutBodyDto,
  ): Promise<VendorPayoutResponseDto> {
    return this.paymentsService.processVendorPayout(
      id,
      user.sub,
      body.bankReference,
    );
  }
}
