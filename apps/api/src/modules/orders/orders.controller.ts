import {
  Body,
  Controller,
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
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, JwtPayload } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { OrdersService, PaginatedResponse } from './orders.service';
import {
  CreateOrderDto,
  OrderResponseDto,
  OrderListItemDto,
  QueryOrdersDto,
  UpdateOrderStatusDto,
  UpdateOrderItemStatusDto,
} from './dto';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Create a new order (buyer only)' })
  @ApiCreatedResponse({
    description: 'Order created successfully',
    type: OrderResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Validation error or insufficient stock' })
  @ApiNotFoundResponse({ description: 'Product or address not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires BUYER role' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.createOrder(user.sub, dto);
  }

  @Get('my')
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'List my orders (buyer)' })
  @ApiOkResponse({ description: 'Paginated list of buyer orders' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires BUYER role' })
  async listMyOrders(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryOrdersDto,
  ): Promise<PaginatedResponse<OrderListItemDto>> {
    return this.ordersService.listBuyerOrders(user.sub, query);
  }

  @Get('vendor')
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'List orders containing my items (vendor)' })
  @ApiOkResponse({ description: 'Paginated list of vendor orders' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires VENDOR role' })
  async listVendorOrders(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryOrdersDto,
  ): Promise<PaginatedResponse<OrderListItemDto>> {
    return this.ordersService.listVendorOrders(user.sub, query);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all orders (admin only)' })
  @ApiOkResponse({ description: 'Paginated list of all orders' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  async listAllOrders(
    @Query() query: QueryOrdersDto,
  ): Promise<PaginatedResponse<OrderListItemDto>> {
    return this.ordersService.listAllOrders(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID (owner/vendor/admin)' })
  @ApiOkResponse({
    description: 'Order details',
    type: OrderResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: no access to this order' })
  async findById(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.findById(id, user.sub, user.role);
  }

  @Patch(':id/status')
  @Roles(UserRole.VENDOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update order status' })
  @ApiOkResponse({
    description: 'Order status updated',
    type: OrderResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateOrderStatus(id, dto, user.sub, user.role);
  }

  @Patch(':id/items/:itemId/status')
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Update order item status (vendor)' })
  @ApiOkResponse({
    description: 'Order item status updated',
    type: OrderResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid item status transition' })
  @ApiNotFoundResponse({ description: 'Order item not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: must own this order item' })
  async updateItemStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) _id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateOrderItemStatusDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateOrderItemStatus(itemId, dto, user.sub);
  }

  @Post(':id/cancel')
  @Roles(UserRole.BUYER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel order (buyer)' })
  @ApiOkResponse({
    description: 'Order cancelled',
    type: OrderResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Cannot cancel: items already shipped' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: can only cancel own orders' })
  async cancelOrder(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.cancelOrder(id, user.sub, reason);
  }
}
