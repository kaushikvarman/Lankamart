import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, JwtPayload } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { LogisticsService, PaginatedResponse } from './logistics.service';
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

@ApiTags('Logistics')
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  // ---------------------------------------------------------------------------
  // PARTNERS
  // ---------------------------------------------------------------------------

  @Post('partners')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a logistics partner (admin only)' })
  @ApiCreatedResponse({
    description: 'Logistics partner created successfully',
    type: LogisticsPartnerResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN role' })
  async createPartner(
    @Body() dto: CreateLogisticsPartnerDto,
  ): Promise<LogisticsPartnerResponseDto> {
    return this.logisticsService.createPartner(dto);
  }

  @Patch('partners/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a logistics partner (admin only)' })
  @ApiOkResponse({
    description: 'Logistics partner updated successfully',
    type: LogisticsPartnerResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Partner not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN role' })
  async updatePartner(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLogisticsPartnerDto,
  ): Promise<LogisticsPartnerResponseDto> {
    return this.logisticsService.updatePartner(id, dto);
  }

  @Get('partners')
  @Public()
  @ApiOperation({ summary: 'List active logistics partners (public)' })
  @ApiOkResponse({
    description: 'List of active logistics partners',
    type: [LogisticsPartnerResponseDto],
  })
  @ApiQuery({ name: 'search', required: false, type: String })
  async listPartners(
    @Query('search') search?: string,
  ): Promise<LogisticsPartnerResponseDto[]> {
    return this.logisticsService.listPartners(search);
  }

  @Get('partners/:slug')
  @Public()
  @ApiOperation({ summary: 'Get logistics partner by slug (public)' })
  @ApiOkResponse({
    description: 'Logistics partner details',
    type: LogisticsPartnerResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Partner not found' })
  async getPartnerBySlug(
    @Param('slug') slug: string,
  ): Promise<LogisticsPartnerResponseDto> {
    return this.logisticsService.getPartnerBySlug(slug);
  }

  // ---------------------------------------------------------------------------
  // ZONES
  // ---------------------------------------------------------------------------

  @Post('zones')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a shipping zone (admin only)' })
  @ApiCreatedResponse({
    description: 'Shipping zone created successfully',
    type: ShippingZoneResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN role' })
  async createZone(
    @Body() dto: CreateShippingZoneDto,
  ): Promise<ShippingZoneResponseDto> {
    return this.logisticsService.createZone(dto);
  }

  @Get('zones')
  @Public()
  @ApiOperation({ summary: 'List all shipping zones (public)' })
  @ApiOkResponse({
    description: 'List of shipping zones',
    type: [ShippingZoneResponseDto],
  })
  async listZones(): Promise<ShippingZoneResponseDto[]> {
    return this.logisticsService.listZones();
  }

  // ---------------------------------------------------------------------------
  // RATES
  // ---------------------------------------------------------------------------

  @Post('rates')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a shipping rate (admin only)' })
  @ApiCreatedResponse({
    description: 'Shipping rate created successfully',
    type: ShippingRateResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Partner or zone not found' })
  @ApiBadRequestResponse({ description: 'Invalid transit days' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN role' })
  async createRate(
    @Body() dto: CreateShippingRateDto,
  ): Promise<ShippingRateResponseDto> {
    return this.logisticsService.createRate(dto);
  }

  @Patch('rates/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a shipping rate (admin only)' })
  @ApiOkResponse({
    description: 'Shipping rate updated successfully',
    type: ShippingRateResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Rate not found' })
  @ApiBadRequestResponse({ description: 'Invalid transit days' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN role' })
  async updateRate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShippingRateDto,
  ): Promise<ShippingRateResponseDto> {
    return this.logisticsService.updateRate(id, dto);
  }

  @Delete('rates/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Soft delete a shipping rate (admin only)' })
  @ApiOkResponse({ description: 'Shipping rate deactivated' })
  @ApiNotFoundResponse({ description: 'Rate not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN role' })
  async deleteRate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.logisticsService.deleteRate(id);
  }

  // ---------------------------------------------------------------------------
  // SHIPPING CALCULATOR
  // ---------------------------------------------------------------------------

  @Post('calculate')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate shipping quotes (public, used at checkout)',
  })
  @ApiOkResponse({
    description: 'Shipping quotes sorted by cost (cheapest first)',
    type: [ShippingQuoteResponseDto],
  })
  async calculateShipping(
    @Body() dto: CalculateShippingDto,
  ): Promise<ShippingQuoteResponseDto[]> {
    return this.logisticsService.calculateShipping(dto);
  }

  // ---------------------------------------------------------------------------
  // SHIPMENTS
  // ---------------------------------------------------------------------------

  @Post('shipments')
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a shipment for an order item (vendor only)' })
  @ApiCreatedResponse({
    description: 'Shipment created successfully',
    type: ShipmentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Order item or partner not found' })
  @ApiForbiddenResponse({ description: 'Forbidden: must own the order item' })
  @ApiBadRequestResponse({ description: 'Shipment already exists for this order item' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async createShipment(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateShipmentDto,
  ): Promise<ShipmentResponseDto> {
    return this.logisticsService.createShipment(user.sub, dto);
  }

  @Get('shipments/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get shipment details' })
  @ApiOkResponse({
    description: 'Shipment details with milestones',
    type: ShipmentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Shipment not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getShipment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ShipmentResponseDto> {
    return this.logisticsService.getShipment(id);
  }

  @Post('shipments/:id/milestones')
  @Roles(UserRole.VENDOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add a tracking milestone to a shipment (vendor/admin)' })
  @ApiCreatedResponse({
    description: 'Milestone added successfully',
    type: ShipmentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Shipment not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async addMilestone(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMilestoneDto,
  ): Promise<ShipmentResponseDto> {
    const vendorId = user.role === UserRole.VENDOR ? user.sub : undefined;
    return this.logisticsService.addMilestone(id, dto, vendorId);
  }

  @Get('shipments')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List shipments (admin only)' })
  @ApiOkResponse({ description: 'Paginated shipment list' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN role' })
  async listShipments(
    @Query() query: QueryShipmentsDto,
  ): Promise<PaginatedResponse<ShipmentResponseDto>> {
    return this.logisticsService.listShipments(query);
  }

  @Get('track/:trackingNumber')
  @Public()
  @ApiOperation({ summary: 'Track a shipment by tracking number (public)' })
  @ApiOkResponse({
    description: 'Shipment tracking details',
    type: ShipmentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Shipment not found' })
  async trackByNumber(
    @Param('trackingNumber') trackingNumber: string,
  ): Promise<ShipmentResponseDto> {
    return this.logisticsService.trackByNumber(trackingNumber);
  }
}
