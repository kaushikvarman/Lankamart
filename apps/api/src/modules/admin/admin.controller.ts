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
  ApiConflictResponse,
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
import { PaginatedResponse } from '@/modules/vendors/vendors.service';
import { AdminService } from './admin.service';
import {
  DashboardStatsDto,
  CreateCouponDto,
  UpdateCouponDto,
  CouponResponseDto,
  QueryCouponsDto,
  ResolveDisputeDto,
  DisputeResponseDto,
  QueryDisputesDto,
  UpdateSettingDto,
  SettingResponseDto,
  QueryAuditLogsDto,
  AuditLogResponseDto,
} from './dto';

@ApiTags('Admin')
@Controller('admin')
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth('access-token')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ---------------------------------------------------------------------------
  // DASHBOARD
  // ---------------------------------------------------------------------------

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiOkResponse({ description: 'Dashboard stats', type: DashboardStatsDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  async getDashboard(): Promise<DashboardStatsDto> {
    return this.adminService.getDashboardStats();
  }

  // ---------------------------------------------------------------------------
  // COUPONS
  // ---------------------------------------------------------------------------

  @Post('coupons')
  @ApiOperation({ summary: 'Create a coupon' })
  @ApiCreatedResponse({ description: 'Coupon created', type: CouponResponseDto })
  @ApiConflictResponse({ description: 'Coupon code already exists' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  async createCoupon(
    @Body() dto: CreateCouponDto,
  ): Promise<CouponResponseDto> {
    return this.adminService.createCoupon(dto);
  }

  @Get('coupons')
  @ApiOperation({ summary: 'List coupons with filters' })
  @ApiOkResponse({ description: 'Paginated coupon list' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  async listCoupons(
    @Query() query: QueryCouponsDto,
  ): Promise<PaginatedResponse<CouponResponseDto>> {
    return this.adminService.listCoupons(query);
  }

  @Get('coupons/:code')
  @ApiOperation({ summary: 'Get coupon by code' })
  @ApiOkResponse({ description: 'Coupon details', type: CouponResponseDto })
  @ApiNotFoundResponse({ description: 'Coupon not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  async getCouponByCode(
    @Param('code') code: string,
  ): Promise<CouponResponseDto> {
    return this.adminService.getCouponByCode(code);
  }

  @Patch('coupons/:id')
  @ApiOperation({ summary: 'Update a coupon' })
  @ApiOkResponse({ description: 'Coupon updated', type: CouponResponseDto })
  @ApiNotFoundResponse({ description: 'Coupon not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  async updateCoupon(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCouponDto,
  ): Promise<CouponResponseDto> {
    return this.adminService.updateCoupon(id, dto);
  }

  @Delete('coupons/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a coupon' })
  @ApiOkResponse({ description: 'Coupon deleted' })
  @ApiNotFoundResponse({ description: 'Coupon not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  async deleteCoupon(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.adminService.deleteCoupon(id);
  }

  // ---------------------------------------------------------------------------
  // DISPUTES (admin management)
  // ---------------------------------------------------------------------------

  @Get('disputes')
  @ApiOperation({ summary: 'List all disputes (admin)' })
  @ApiOkResponse({ description: 'Paginated dispute list' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  async listDisputes(
    @Query() query: QueryDisputesDto,
  ): Promise<PaginatedResponse<DisputeResponseDto>> {
    return this.adminService.listDisputes(query);
  }

  @Get('disputes/:id')
  @ApiOperation({ summary: 'Get dispute details (admin)' })
  @ApiOkResponse({ description: 'Dispute details', type: DisputeResponseDto })
  @ApiNotFoundResponse({ description: 'Dispute not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  async getDispute(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DisputeResponseDto> {
    return this.adminService.getDispute(id);
  }

  @Patch('disputes/:id/resolve')
  @ApiOperation({ summary: 'Resolve a dispute (admin)' })
  @ApiOkResponse({ description: 'Dispute resolved', type: DisputeResponseDto })
  @ApiNotFoundResponse({ description: 'Dispute not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  async resolveDispute(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveDisputeDto,
  ): Promise<DisputeResponseDto> {
    return this.adminService.resolveDispute(id, user.sub, dto);
  }

  @Patch('disputes/:id/escalate')
  @ApiOperation({ summary: 'Escalate a dispute (admin)' })
  @ApiOkResponse({ description: 'Dispute escalated', type: DisputeResponseDto })
  @ApiNotFoundResponse({ description: 'Dispute not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  async escalateDispute(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DisputeResponseDto> {
    return this.adminService.escalateDispute(id, user.sub);
  }

  // ---------------------------------------------------------------------------
  // PLATFORM SETTINGS
  // ---------------------------------------------------------------------------

  @Get('settings')
  @ApiOperation({ summary: 'List platform settings' })
  @ApiOkResponse({ description: 'Settings list', type: [SettingResponseDto] })
  @ApiQuery({ name: 'group', required: false, type: String })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  async getSettings(
    @Query('group') group?: string,
  ): Promise<SettingResponseDto[]> {
    return this.adminService.getSettings(group);
  }

  @Get('settings/:key')
  @ApiOperation({ summary: 'Get a single platform setting' })
  @ApiOkResponse({ description: 'Setting details', type: SettingResponseDto })
  @ApiNotFoundResponse({ description: 'Setting not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  async getSetting(
    @Param('key') key: string,
  ): Promise<SettingResponseDto> {
    return this.adminService.getSetting(key);
  }

  @Patch('settings/:key')
  @ApiOperation({ summary: 'Update a platform setting' })
  @ApiOkResponse({ description: 'Setting updated', type: SettingResponseDto })
  @ApiNotFoundResponse({ description: 'Setting not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  async updateSetting(
    @CurrentUser() user: JwtPayload,
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
  ): Promise<SettingResponseDto> {
    return this.adminService.updateSetting(key, dto, user.sub);
  }

  // ---------------------------------------------------------------------------
  // AUDIT LOGS
  // ---------------------------------------------------------------------------

  @Get('audit-logs')
  @ApiOperation({ summary: 'List audit logs' })
  @ApiOkResponse({ description: 'Paginated audit logs' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  async listAuditLogs(
    @Query() query: QueryAuditLogsDto,
  ): Promise<PaginatedResponse<AuditLogResponseDto>> {
    return this.adminService.listAuditLogs(query);
  }
}
