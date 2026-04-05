import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewResponseDto,
  QueryReviewsDto,
  ReviewSortBy,
  ReviewStatsDto,
  VendorReplyDto,
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

const REVIEW_INCLUDE = {
  author: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
  },
  product: {
    select: {
      id: true,
      name: true,
    },
  },
  targetUser: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createReview(
    authorId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    if (!dto.productId && !dto.targetUserId) {
      throw new BadRequestException(
        'At least one of productId or targetUserId must be provided',
      );
    }

    if (dto.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
      });
      if (!product) {
        throw new NotFoundException(
          `Product with ID "${dto.productId}" not found`,
        );
      }
    }

    if (dto.targetUserId) {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: dto.targetUserId },
      });
      if (!targetUser) {
        throw new NotFoundException(
          `User with ID "${dto.targetUserId}" not found`,
        );
      }
    }

    let isVerified = false;

    if (dto.orderItemId) {
      const orderItem = await this.prisma.orderItem.findUnique({
        where: { id: dto.orderItemId },
        include: { order: true },
      });

      if (!orderItem) {
        throw new NotFoundException(
          `Order item with ID "${dto.orderItemId}" not found`,
        );
      }

      if (orderItem.order.buyerId !== authorId) {
        throw new ForbiddenException(
          'Order item does not belong to this user',
        );
      }

      if (orderItem.order.status !== OrderStatus.DELIVERED) {
        throw new BadRequestException(
          'Can only review items from delivered orders',
        );
      }

      isVerified = true;
    }

    const existingReview = await this.prisma.review.findFirst({
      where: {
        authorId,
        ...(dto.productId ? { productId: dto.productId } : {}),
        ...(dto.targetUserId ? { targetUserId: dto.targetUserId } : {}),
        ...(dto.orderItemId ? { orderItemId: dto.orderItemId } : {}),
      },
    });

    if (existingReview) {
      throw new ConflictException(
        'You have already submitted a review for this item',
      );
    }

    const review = await this.prisma.review.create({
      data: {
        authorId,
        productId: dto.productId,
        targetUserId: dto.targetUserId,
        orderItemId: dto.orderItemId,
        rating: dto.rating,
        title: dto.title,
        content: dto.content,
        images: dto.images ? JSON.stringify(dto.images) : undefined,
        isVerified,
      },
      include: REVIEW_INCLUDE,
    });

    if (dto.productId) {
      await this.recalculateProductRating(dto.productId);
    }

    if (dto.targetUserId) {
      await this.recalculateVendorRating(dto.targetUserId);
    }

    this.logger.log(
      `Review created: ${review.id} by user ${authorId} — rating ${dto.rating}`,
    );

    return ReviewResponseDto.fromEntity(review);
  }

  async updateReview(
    reviewId: string,
    authorId: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID "${reviewId}" not found`);
    }

    if (review.authorId !== authorId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    const ratingChanged =
      dto.rating !== undefined && dto.rating !== review.rating;

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.images !== undefined && {
          images: JSON.stringify(dto.images),
        }),
      },
      include: REVIEW_INCLUDE,
    });

    if (ratingChanged) {
      if (review.productId) {
        await this.recalculateProductRating(review.productId);
      }
      if (review.targetUserId) {
        await this.recalculateVendorRating(review.targetUserId);
      }
    }

    this.logger.log(`Review updated: ${reviewId} by author ${authorId}`);

    return ReviewResponseDto.fromEntity(updatedReview);
  }

  async deleteReview(
    reviewId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<{ message: string }> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID "${reviewId}" not found`);
    }

    const isAdmin =
      userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    const isAuthor = review.authorId === userId;

    if (!isAdmin && !isAuthor) {
      throw new ForbiddenException(
        'You can only delete your own reviews',
      );
    }

    await this.prisma.review.delete({ where: { id: reviewId } });

    if (review.productId) {
      await this.recalculateProductRating(review.productId);
    }
    if (review.targetUserId) {
      await this.recalculateVendorRating(review.targetUserId);
    }

    this.logger.log(
      `Review deleted: ${reviewId} by ${isAdmin ? 'admin' : 'author'} ${userId}`,
    );

    return { message: 'Review deleted successfully' };
  }

  async getReviewById(reviewId: string): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId, isVisible: true },
      include: REVIEW_INCLUDE,
    });

    if (!review) {
      throw new NotFoundException(`Review with ID "${reviewId}" not found`);
    }

    return ReviewResponseDto.fromEntity(review);
  }

  async listReviews(
    query: QueryReviewsDto,
  ): Promise<PaginatedResponse<ReviewResponseDto>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      isVisible: true,
    };

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.targetUserId) {
      where.targetUserId = query.targetUserId;
    }

    if (query.rating) {
      where.rating = query.rating;
    }

    const orderBy = this.buildReviewSortOrder(query.sortBy);

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: REVIEW_INCLUDE,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.review.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: reviews.map((r) => ReviewResponseDto.fromEntity(r)),
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

  async getProductReviewStats(productId: string): Promise<ReviewStatsDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID "${productId}" not found`,
      );
    }

    return this.buildReviewStats({ productId, isVisible: true });
  }

  async getVendorReviewStats(vendorId: string): Promise<ReviewStatsDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: vendorId },
    });

    if (!user) {
      throw new NotFoundException(
        `Vendor with ID "${vendorId}" not found`,
      );
    }

    return this.buildReviewStats({ targetUserId: vendorId, isVisible: true });
  }

  async addVendorReply(
    reviewId: string,
    vendorId: string,
    dto: VendorReplyDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        product: { select: { vendorId: true } },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID "${reviewId}" not found`);
    }

    const isProductVendor =
      review.product !== null && review.product.vendorId === vendorId;
    const isTargetVendor = review.targetUserId === vendorId;

    if (!isProductVendor && !isTargetVendor) {
      throw new ForbiddenException(
        'You can only reply to reviews on your own products or reviews targeting you',
      );
    }

    if (review.vendorReply) {
      throw new ConflictException(
        'A vendor reply already exists for this review',
      );
    }

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        vendorReply: dto.content,
        vendorRepliedAt: new Date(),
      },
      include: REVIEW_INCLUDE,
    });

    this.logger.log(
      `Vendor reply added to review ${reviewId} by vendor ${vendorId}`,
    );

    return ReviewResponseDto.fromEntity(updatedReview);
  }

  async markHelpful(
    reviewId: string,
    _userId: string,
  ): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID "${reviewId}" not found`);
    }

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: { helpfulCount: { increment: 1 } },
      include: REVIEW_INCLUDE,
    });

    return ReviewResponseDto.fromEntity(updatedReview);
  }

  async moderateReview(
    reviewId: string,
    adminId: string,
    visible: boolean,
  ): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID "${reviewId}" not found`);
    }

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: { isVisible: visible },
      include: REVIEW_INCLUDE,
    });

    if (review.productId) {
      await this.recalculateProductRating(review.productId);
    }
    if (review.targetUserId) {
      await this.recalculateVendorRating(review.targetUserId);
    }

    this.logger.log(
      `Review ${reviewId} moderated by admin ${adminId}: visible=${String(visible)}`,
    );

    return ReviewResponseDto.fromEntity(updatedReview);
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  private async recalculateProductRating(productId: string): Promise<void> {
    const result = await this.prisma.review.aggregate({
      where: { productId, isVisible: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: new Prisma.Decimal(
          (result._avg.rating ?? 0).toFixed(2),
        ),
        totalReviews: result._count.rating,
      },
    });
  }

  private async recalculateVendorRating(vendorUserId: string): Promise<void> {
    const result = await this.prisma.review.aggregate({
      where: { targetUserId: vendorUserId, isVisible: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId: vendorUserId },
    });

    if (!vendorProfile) {
      return;
    }

    await this.prisma.vendorProfile.update({
      where: { userId: vendorUserId },
      data: {
        averageRating: new Prisma.Decimal(
          (result._avg.rating ?? 0).toFixed(2),
        ),
        totalReviews: result._count.rating,
      },
    });
  }

  private async buildReviewStats(
    where: Prisma.ReviewWhereInput,
  ): Promise<ReviewStatsDto> {
    const [aggregation, distribution] = await Promise.all([
      this.prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where,
        _count: { rating: true },
      }),
    ]);

    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    for (const group of distribution) {
      ratingDistribution[group.rating] = group._count.rating;
    }

    return {
      averageRating: Number((aggregation._avg.rating ?? 0).toFixed(2)),
      totalReviews: aggregation._count.rating,
      ratingDistribution: ratingDistribution as unknown as ReviewStatsDto['ratingDistribution'],
    };
  }

  private buildReviewSortOrder(
    sortBy?: ReviewSortBy,
  ): Prisma.ReviewOrderByWithRelationInput[] {
    switch (sortBy) {
      case ReviewSortBy.OLDEST:
        return [{ createdAt: 'asc' }];
      case ReviewSortBy.RATING_HIGH:
        return [{ rating: 'desc' }, { createdAt: 'desc' }];
      case ReviewSortBy.RATING_LOW:
        return [{ rating: 'asc' }, { createdAt: 'desc' }];
      case ReviewSortBy.HELPFUL:
        return [{ helpfulCount: 'desc' }, { createdAt: 'desc' }];
      case ReviewSortBy.NEWEST:
      default:
        return [{ createdAt: 'desc' }];
    }
  }
}
