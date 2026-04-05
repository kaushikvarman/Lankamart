import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, JwtPayload } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RfqService, PaginatedResponse } from './rfq.service';
import {
  CreateRfqDto,
  RfqResponseDto,
  CreateRfqQuoteDto,
  RfqQuoteResponseDto,
  QueryRfqsDto,
} from './dto';

@ApiTags('RFQ')
@ApiBearerAuth('access-token')
@Controller('rfq')
export class RfqController {
  constructor(private readonly rfqService: RfqService) {}

  @Post()
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Create a new RFQ (buyer only)' })
  @ApiCreatedResponse({
    description: 'RFQ created successfully',
    type: RfqResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Product not found (if productId provided)' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires BUYER role' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRfqDto,
  ): Promise<RfqResponseDto> {
    return this.rfqService.createRfq(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List RFQs (role-aware)' })
  @ApiOkResponse({ description: 'Paginated list of RFQs' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async listRfqs(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryRfqsDto,
  ): Promise<PaginatedResponse<RfqResponseDto>> {
    return this.rfqService.listRfqs(user.sub, user.role, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get RFQ details' })
  @ApiOkResponse({
    description: 'RFQ details',
    type: RfqResponseDto,
  })
  @ApiNotFoundResponse({ description: 'RFQ not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findById(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RfqResponseDto> {
    return this.rfqService.getRfqById(id, user.sub, user.role);
  }

  @Post(':id/quotes')
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Submit a quote for an RFQ (vendor only)' })
  @ApiCreatedResponse({
    description: 'Quote submitted successfully',
    type: RfqQuoteResponseDto,
  })
  @ApiBadRequestResponse({ description: 'RFQ is not open or has expired' })
  @ApiConflictResponse({ description: 'You already submitted a quote for this RFQ' })
  @ApiNotFoundResponse({ description: 'RFQ not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires VENDOR role' })
  async submitQuote(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRfqQuoteDto,
  ): Promise<RfqQuoteResponseDto> {
    dto.rfqId = id;
    return this.rfqService.submitQuote(user.sub, dto);
  }

  @Post('quotes/:quoteId/accept')
  @Roles(UserRole.BUYER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a quote (buyer only)' })
  @ApiOkResponse({
    description: 'Quote accepted',
    type: RfqQuoteResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Quote already accepted or RFQ already fulfilled' })
  @ApiNotFoundResponse({ description: 'Quote not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: can only accept quotes on your own RFQs' })
  async acceptQuote(
    @CurrentUser() user: JwtPayload,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
  ): Promise<RfqQuoteResponseDto> {
    return this.rfqService.acceptQuote(user.sub, quoteId);
  }

  @Post('quotes/:quoteId/decline')
  @Roles(UserRole.BUYER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline a quote (buyer only)' })
  @ApiOkResponse({
    description: 'Quote declined',
    type: RfqQuoteResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Cannot decline an accepted quote' })
  @ApiNotFoundResponse({ description: 'Quote not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: can only decline quotes on your own RFQs' })
  async declineQuote(
    @CurrentUser() user: JwtPayload,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
  ): Promise<RfqQuoteResponseDto> {
    return this.rfqService.declineQuote(user.sub, quoteId);
  }
}
