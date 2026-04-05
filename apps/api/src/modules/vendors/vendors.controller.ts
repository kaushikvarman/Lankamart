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
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { KycStatus, UserRole } from '@prisma/client';
import { CurrentUser, JwtPayload } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { PaginatedResponse, VendorsService } from './vendors.service';
import {
  CreateKycDocumentDto,
  CreatePayoutAccountDto,
  CreateVendorProfileDto,
  QueryVendorsDto,
  ReviewKycDocumentDto,
  UpdatePayoutAccountDto,
  UpdateVendorProfileDto,
  VendorProfileResponseDto,
  VendorStatsDto,
} from './dto';
import { PublicVendorProfileResponseDto } from './dto/vendor-profile-response.dto';

@ApiTags('Vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  // ---------------------------------------------------------------------------
  // PROFILE ENDPOINTS
  // ---------------------------------------------------------------------------

  @Post('profile')
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create vendor profile (VENDOR only)' })
  @ApiCreatedResponse({
    description: 'Vendor profile created successfully',
    type: VendorProfileResponseDto,
  })
  @ApiConflictResponse({ description: 'Vendor profile already exists' })
  @ApiForbiddenResponse({ description: 'Only VENDOR role users can create a profile' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async createProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateVendorProfileDto,
  ): Promise<VendorProfileResponseDto> {
    return this.vendorsService.createProfile(user.sub, dto);
  }

  @Get('profile/me')
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get own vendor profile (VENDOR only)' })
  @ApiOkResponse({
    description: 'Vendor profile retrieved',
    type: VendorProfileResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Vendor profile not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getMyProfile(
    @CurrentUser() user: JwtPayload,
  ): Promise<VendorProfileResponseDto> {
    return this.vendorsService.getMyProfile(user.sub);
  }

  @Patch('profile/me')
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update own vendor profile (VENDOR only)' })
  @ApiOkResponse({
    description: 'Vendor profile updated',
    type: VendorProfileResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Vendor profile not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateMyProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateVendorProfileDto,
  ): Promise<VendorProfileResponseDto> {
    return this.vendorsService.updateProfile(user.sub, dto);
  }

  @Get('profile/:slug')
  @Public()
  @ApiOperation({ summary: 'Get vendor profile by business slug (public)' })
  @ApiOkResponse({
    description: 'Vendor profile retrieved',
    type: PublicVendorProfileResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Vendor not found' })
  async getProfileBySlug(
    @Param('slug') slug: string,
  ): Promise<PublicVendorProfileResponseDto> {
    return this.vendorsService.getProfileBySlug(slug);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List vendors with filters (ADMIN/SUPER_ADMIN only)' })
  @ApiOkResponse({ description: 'Paginated list of vendor profiles' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  async listVendors(
    @Query() query: QueryVendorsDto,
  ): Promise<PaginatedResponse<VendorProfileResponseDto>> {
    return this.vendorsService.listVendors(query);
  }

  // ---------------------------------------------------------------------------
  // KYC ENDPOINTS
  // ---------------------------------------------------------------------------

  @Post('kyc')
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Submit a KYC document (VENDOR only)' })
  @ApiCreatedResponse({ description: 'KYC document submitted' })
  @ApiNotFoundResponse({ description: 'Vendor profile not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async submitKycDocument(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateKycDocumentDto,
  ): Promise<{
    id: string;
    type: string;
    fileName: string;
    fileUrl: string;
    status: KycStatus;
    createdAt: Date;
  }> {
    const document = await this.vendorsService.submitKycDocument(user.sub, dto);
    return {
      id: document.id,
      type: document.type,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      status: document.status,
      createdAt: document.createdAt,
    };
  }

  @Get('kyc')
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get my KYC documents (VENDOR only)' })
  @ApiOkResponse({ description: 'List of KYC documents' })
  @ApiNotFoundResponse({ description: 'Vendor profile not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getMyKycDocuments(
    @CurrentUser() user: JwtPayload,
  ): Promise<{
    id: string;
    type: string;
    fileName: string;
    fileUrl: string;
    status: KycStatus;
    reviewNote: string | null;
    reviewedAt: Date | null;
    createdAt: Date;
  }[]> {
    const documents = await this.vendorsService.getMyKycDocuments(user.sub);
    return documents.map((doc) => ({
      id: doc.id,
      type: doc.type,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      status: doc.status,
      reviewNote: doc.reviewNote,
      reviewedAt: doc.reviewedAt,
      createdAt: doc.createdAt,
    }));
  }

  @Patch('kyc/:id/review')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Review a KYC document (ADMIN/SUPER_ADMIN only)' })
  @ApiOkResponse({ description: 'KYC document reviewed' })
  @ApiNotFoundResponse({ description: 'KYC document not found' })
  @ApiBadRequestResponse({ description: 'Document already reviewed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  async reviewKycDocument(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewKycDocumentDto,
  ): Promise<{
    id: string;
    type: string;
    status: KycStatus;
    reviewNote: string | null;
    reviewedAt: Date | null;
    reviewedBy: string | null;
  }> {
    const document = await this.vendorsService.reviewKycDocument(id, user.sub, dto);
    return {
      id: document.id,
      type: document.type,
      status: document.status,
      reviewNote: document.reviewNote,
      reviewedAt: document.reviewedAt,
      reviewedBy: document.reviewedBy,
    };
  }

  @Get('kyc/pending')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List vendors with pending KYC reviews (ADMIN/SUPER_ADMIN only)' })
  @ApiOkResponse({ description: 'Paginated list of vendors pending KYC review' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  async listPendingKyc(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedResponse<VendorProfileResponseDto>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.vendorsService.listPendingKyc(
      Math.max(1, pageNum),
      Math.min(100, Math.max(1, limitNum)),
    );
  }

  // ---------------------------------------------------------------------------
  // PAYOUT ACCOUNT ENDPOINTS
  // ---------------------------------------------------------------------------

  @Post('payout-accounts')
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a payout account (VENDOR only)' })
  @ApiCreatedResponse({ description: 'Payout account created' })
  @ApiNotFoundResponse({ description: 'Vendor profile not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async createPayoutAccount(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePayoutAccountDto,
  ): Promise<{
    id: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingCode: string | null;
    swiftCode: string | null;
    currency: string;
    isDefault: boolean;
    createdAt: Date;
  }> {
    const account = await this.vendorsService.createPayoutAccount(user.sub, dto);
    return {
      id: account.id,
      bankName: account.bankName,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      routingCode: account.routingCode,
      swiftCode: account.swiftCode,
      currency: account.currency,
      isDefault: account.isDefault,
      createdAt: account.createdAt,
    };
  }

  @Get('payout-accounts')
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List my payout accounts (VENDOR only)' })
  @ApiOkResponse({ description: 'List of payout accounts' })
  @ApiNotFoundResponse({ description: 'Vendor profile not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getPayoutAccounts(
    @CurrentUser() user: JwtPayload,
  ): Promise<{
    id: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingCode: string | null;
    swiftCode: string | null;
    currency: string;
    isDefault: boolean;
    isVerified: boolean;
    createdAt: Date;
  }[]> {
    const accounts = await this.vendorsService.getPayoutAccounts(user.sub);
    return accounts.map((acc) => ({
      id: acc.id,
      bankName: acc.bankName,
      accountName: acc.accountName,
      accountNumber: acc.accountNumber,
      routingCode: acc.routingCode,
      swiftCode: acc.swiftCode,
      currency: acc.currency,
      isDefault: acc.isDefault,
      isVerified: acc.isVerified,
      createdAt: acc.createdAt,
    }));
  }

  @Patch('payout-accounts/:id')
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a payout account (VENDOR only)' })
  @ApiOkResponse({ description: 'Payout account updated' })
  @ApiNotFoundResponse({ description: 'Payout account not found' })
  @ApiForbiddenResponse({ description: 'Account does not belong to this vendor' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updatePayoutAccount(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePayoutAccountDto,
  ): Promise<{
    id: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingCode: string | null;
    swiftCode: string | null;
    currency: string;
    isDefault: boolean;
    isVerified: boolean;
    updatedAt: Date;
  }> {
    const account = await this.vendorsService.updatePayoutAccount(user.sub, id, dto);
    return {
      id: account.id,
      bankName: account.bankName,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      routingCode: account.routingCode,
      swiftCode: account.swiftCode,
      currency: account.currency,
      isDefault: account.isDefault,
      isVerified: account.isVerified,
      updatedAt: account.updatedAt,
    };
  }

  @Delete('payout-accounts/:id')
  @Roles(UserRole.VENDOR)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a payout account (VENDOR only)' })
  @ApiOkResponse({ description: 'Payout account deleted' })
  @ApiNotFoundResponse({ description: 'Payout account not found' })
  @ApiBadRequestResponse({ description: 'Cannot delete default or only account' })
  @ApiForbiddenResponse({ description: 'Account does not belong to this vendor' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async deletePayoutAccount(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.vendorsService.deletePayoutAccount(user.sub, id);
  }

  // ---------------------------------------------------------------------------
  // DASHBOARD
  // ---------------------------------------------------------------------------

  @Get('dashboard/stats')
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get vendor dashboard statistics (VENDOR only)' })
  @ApiOkResponse({
    description: 'Dashboard statistics',
    type: VendorStatsDto,
  })
  @ApiNotFoundResponse({ description: 'Vendor profile not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getDashboardStats(
    @CurrentUser() user: JwtPayload,
  ): Promise<VendorStatsDto> {
    return this.vendorsService.getDashboardStats(user.sub);
  }
}
