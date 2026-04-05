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
import {
  CurrentUser,
  JwtPayload,
} from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { PaginatedResponse, ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewResponseDto,
  QueryReviewsDto,
  ReviewStatsDto,
  VendorReplyDto,
  ModerateReviewDto,
} from './dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a review (authenticated buyer)' })
  @ApiCreatedResponse({
    description: 'Review created',
    type: ReviewResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Validation error or order not delivered' })
  @ApiConflictResponse({ description: 'Duplicate review' })
  @ApiNotFoundResponse({ description: 'Product, user, or order item not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.createReview(user.sub, dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List reviews (public, with filters)' })
  @ApiOkResponse({ description: 'Paginated review list' })
  async list(
    @Query() query: QueryReviewsDto,
  ): Promise<PaginatedResponse<ReviewResponseDto>> {
    return this.reviewsService.listReviews(query);
  }

  @Get('products/:productId/stats')
  @Public()
  @ApiOperation({ summary: 'Get product review stats (public)' })
  @ApiOkResponse({ description: 'Review statistics for the product', type: ReviewStatsDto })
  @ApiNotFoundResponse({ description: 'Product not found' })
  async getProductStats(
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<ReviewStatsDto> {
    return this.reviewsService.getProductReviewStats(productId);
  }

  @Get('vendors/:vendorId/stats')
  @Public()
  @ApiOperation({ summary: 'Get vendor review stats (public)' })
  @ApiOkResponse({ description: 'Review statistics for the vendor', type: ReviewStatsDto })
  @ApiNotFoundResponse({ description: 'Vendor not found' })
  async getVendorStats(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
  ): Promise<ReviewStatsDto> {
    return this.reviewsService.getVendorReviewStats(vendorId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get review by ID (public)' })
  @ApiOkResponse({ description: 'Review details', type: ReviewResponseDto })
  @ApiNotFoundResponse({ description: 'Review not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.getReviewById(id);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update review (author only)' })
  @ApiOkResponse({ description: 'Review updated', type: ReviewResponseDto })
  @ApiNotFoundResponse({ description: 'Review not found' })
  @ApiForbiddenResponse({ description: 'Not the review author' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.updateReview(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete review (author or admin)' })
  @ApiOkResponse({ description: 'Review deleted' })
  @ApiNotFoundResponse({ description: 'Review not found' })
  @ApiForbiddenResponse({ description: 'Not authorized to delete this review' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.reviewsService.deleteReview(id, user.sub, user.role);
  }

  // ---------------------------------------------------------------------------
  // VENDOR REPLY
  // ---------------------------------------------------------------------------

  @Post(':id/reply')
  @Roles(UserRole.VENDOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Reply to a review (vendor only)' })
  @ApiCreatedResponse({ description: 'Vendor reply added', type: ReviewResponseDto })
  @ApiNotFoundResponse({ description: 'Review not found' })
  @ApiForbiddenResponse({ description: 'Not the product/target vendor' })
  @ApiConflictResponse({ description: 'Vendor reply already exists' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async addVendorReply(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VendorReplyDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.addVendorReply(id, user.sub, dto);
  }

  // ---------------------------------------------------------------------------
  // HELPFUL
  // ---------------------------------------------------------------------------

  @Post(':id/helpful')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mark review as helpful (authenticated)' })
  @ApiOkResponse({ description: 'Helpful count incremented', type: ReviewResponseDto })
  @ApiNotFoundResponse({ description: 'Review not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async markHelpful(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.markHelpful(id, user.sub);
  }

  // ---------------------------------------------------------------------------
  // MODERATION
  // ---------------------------------------------------------------------------

  @Patch(':id/moderate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Moderate review visibility (admin only)' })
  @ApiOkResponse({ description: 'Review moderation updated', type: ReviewResponseDto })
  @ApiNotFoundResponse({ description: 'Review not found' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN or SUPER_ADMIN role' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async moderate(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.moderateReview(id, user.sub, dto.visible);
  }
}
