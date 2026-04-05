import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto';

const MOCK_AUTHOR_ID = 'author-001';
const MOCK_VENDOR_ID = 'vendor-001';
const MOCK_PRODUCT_ID = 'product-001';
const MOCK_ORDER_ITEM_ID = 'order-item-001';
const MOCK_REVIEW_ID = 'review-001';
const MOCK_ADMIN_ID = 'admin-001';

const mockAuthor = {
  id: MOCK_AUTHOR_ID,
  firstName: 'John',
  lastName: 'Doe',
  avatarUrl: null,
};

const mockProduct = {
  id: MOCK_PRODUCT_ID,
  name: 'Test Product',
  vendorId: MOCK_VENDOR_ID,
  averageRating: new Prisma.Decimal(0),
  totalReviews: 0,
};

const mockTargetUser = {
  id: MOCK_VENDOR_ID,
  firstName: 'Vendor',
  lastName: 'User',
};

const mockOrderItem = {
  id: MOCK_ORDER_ITEM_ID,
  productId: MOCK_PRODUCT_ID,
  vendorId: MOCK_VENDOR_ID,
  order: {
    id: 'order-001',
    buyerId: MOCK_AUTHOR_ID,
    status: OrderStatus.DELIVERED,
  },
};

const mockReview = {
  id: MOCK_REVIEW_ID,
  authorId: MOCK_AUTHOR_ID,
  productId: MOCK_PRODUCT_ID,
  targetUserId: null,
  orderItemId: null,
  rating: 4,
  title: 'Great product',
  content: 'Really enjoyed this product.',
  images: null,
  isVerified: false,
  helpfulCount: 0,
  vendorReply: null,
  vendorRepliedAt: null,
  isVisible: true,
  createdAt: new Date('2025-06-01'),
  updatedAt: new Date('2025-06-01'),
  author: mockAuthor,
  product: { id: MOCK_PRODUCT_ID, name: 'Test Product' },
  targetUser: null,
};

const mockPrisma = {
  product: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  orderItem: {
    findUnique: jest.fn(),
  },
  review: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  vendorProfile: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('ReviewsService', () => {
  let service: ReviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // createReview
  // ---------------------------------------------------------------------------

  describe('createReview', () => {
    it('should create a product review successfully', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue(mockReview);
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 4 },
        _count: { rating: 1 },
      });
      mockPrisma.product.update.mockResolvedValue(mockProduct);

      const dto: CreateReviewDto = {
        productId: MOCK_PRODUCT_ID,
        rating: 4,
        title: 'Great product',
        content: 'Really enjoyed this product.',
      } as CreateReviewDto;

      const result = await service.createReview(MOCK_AUTHOR_ID, dto);

      expect(result.id).toBe(MOCK_REVIEW_ID);
      expect(result.rating).toBe(4);
      expect(result.authorId).toBe(MOCK_AUTHOR_ID);
      expect(mockPrisma.review.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.product.update).toHaveBeenCalledTimes(1);
    });

    it('should create a vendor review successfully', async () => {
      const vendorReview = {
        ...mockReview,
        productId: null,
        targetUserId: MOCK_VENDOR_ID,
        product: null,
        targetUser: mockTargetUser,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockTargetUser);
      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue(vendorReview);
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 4 },
        _count: { rating: 1 },
      });
      mockPrisma.vendorProfile.findUnique.mockResolvedValue({
        userId: MOCK_VENDOR_ID,
      });
      mockPrisma.vendorProfile.update.mockResolvedValue({});

      const dto: CreateReviewDto = {
        targetUserId: MOCK_VENDOR_ID,
        rating: 4,
      } as CreateReviewDto;

      const result = await service.createReview(MOCK_AUTHOR_ID, dto);

      expect(result.targetUserId).toBe(MOCK_VENDOR_ID);
      expect(mockPrisma.vendorProfile.update).toHaveBeenCalledTimes(1);
    });

    it('should set isVerified when orderItemId belongs to a DELIVERED order', async () => {
      const verifiedReview = {
        ...mockReview,
        isVerified: true,
        orderItemId: MOCK_ORDER_ITEM_ID,
      };

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.orderItem.findUnique.mockResolvedValue(mockOrderItem);
      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue(verifiedReview);
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 4 },
        _count: { rating: 1 },
      });
      mockPrisma.product.update.mockResolvedValue(mockProduct);

      const dto: CreateReviewDto = {
        productId: MOCK_PRODUCT_ID,
        orderItemId: MOCK_ORDER_ITEM_ID,
        rating: 4,
      } as CreateReviewDto;

      const result = await service.createReview(MOCK_AUTHOR_ID, dto);

      expect(result.isVerified).toBe(true);
      expect(mockPrisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isVerified: true }),
        }),
      );
    });

    it('should throw ConflictException for duplicate review', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.review.findFirst.mockResolvedValue(mockReview);

      const dto: CreateReviewDto = {
        productId: MOCK_PRODUCT_ID,
        rating: 4,
      } as CreateReviewDto;

      await expect(
        service.createReview(MOCK_AUTHOR_ID, dto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when neither productId nor targetUserId provided', async () => {
      const dto: CreateReviewDto = {
        rating: 4,
      } as CreateReviewDto;

      await expect(
        service.createReview(MOCK_AUTHOR_ID, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const dto: CreateReviewDto = {
        productId: 'non-existent-product',
        rating: 4,
      } as CreateReviewDto;

      await expect(
        service.createReview(MOCK_AUTHOR_ID, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when order is not DELIVERED', async () => {
      const pendingOrderItem = {
        ...mockOrderItem,
        order: { ...mockOrderItem.order, status: OrderStatus.PENDING },
      };

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.orderItem.findUnique.mockResolvedValue(pendingOrderItem);

      const dto: CreateReviewDto = {
        productId: MOCK_PRODUCT_ID,
        orderItemId: MOCK_ORDER_ITEM_ID,
        rating: 4,
      } as CreateReviewDto;

      await expect(
        service.createReview(MOCK_AUTHOR_ID, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when orderItem belongs to another user', async () => {
      const otherUserOrderItem = {
        ...mockOrderItem,
        order: { ...mockOrderItem.order, buyerId: 'other-user' },
      };

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.orderItem.findUnique.mockResolvedValue(otherUserOrderItem);

      const dto: CreateReviewDto = {
        productId: MOCK_PRODUCT_ID,
        orderItemId: MOCK_ORDER_ITEM_ID,
        rating: 4,
      } as CreateReviewDto;

      await expect(
        service.createReview(MOCK_AUTHOR_ID, dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ---------------------------------------------------------------------------
  // updateReview
  // ---------------------------------------------------------------------------

  describe('updateReview', () => {
    it('should update review when author requests it', async () => {
      const updatedReview = { ...mockReview, rating: 5, title: 'Updated' };

      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.update.mockResolvedValue(updatedReview);
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 5 },
        _count: { rating: 1 },
      });
      mockPrisma.product.update.mockResolvedValue(mockProduct);

      const result = await service.updateReview(
        MOCK_REVIEW_ID,
        MOCK_AUTHOR_ID,
        { rating: 5, title: 'Updated' },
      );

      expect(result.rating).toBe(5);
      expect(mockPrisma.product.update).toHaveBeenCalledTimes(1);
    });

    it('should throw ForbiddenException when non-author tries to update', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);

      await expect(
        service.updateReview(MOCK_REVIEW_ID, 'other-user', {
          rating: 1,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should not recalculate rating when rating is unchanged', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.update.mockResolvedValue({
        ...mockReview,
        title: 'New title',
      });

      await service.updateReview(MOCK_REVIEW_ID, MOCK_AUTHOR_ID, {
        title: 'New title',
      });

      expect(mockPrisma.review.aggregate).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // deleteReview
  // ---------------------------------------------------------------------------

  describe('deleteReview', () => {
    it('should allow author to delete own review', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.delete.mockResolvedValue(mockReview);
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      });
      mockPrisma.product.update.mockResolvedValue(mockProduct);

      const result = await service.deleteReview(
        MOCK_REVIEW_ID,
        MOCK_AUTHOR_ID,
        UserRole.BUYER,
      );

      expect(result.message).toBe('Review deleted successfully');
      expect(mockPrisma.review.delete).toHaveBeenCalledWith({
        where: { id: MOCK_REVIEW_ID },
      });
    });

    it('should allow admin to delete any review', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.delete.mockResolvedValue(mockReview);
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      });
      mockPrisma.product.update.mockResolvedValue(mockProduct);

      const result = await service.deleteReview(
        MOCK_REVIEW_ID,
        MOCK_ADMIN_ID,
        UserRole.ADMIN,
      );

      expect(result.message).toBe('Review deleted successfully');
    });

    it('should throw ForbiddenException when non-author non-admin tries to delete', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);

      await expect(
        service.deleteReview(MOCK_REVIEW_ID, 'other-user', UserRole.BUYER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should recalculate product rating after deletion', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.delete.mockResolvedValue(mockReview);
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      });
      mockPrisma.product.update.mockResolvedValue(mockProduct);

      await service.deleteReview(
        MOCK_REVIEW_ID,
        MOCK_AUTHOR_ID,
        UserRole.BUYER,
      );

      expect(mockPrisma.review.aggregate).toHaveBeenCalledWith({
        where: { productId: MOCK_PRODUCT_ID, isVisible: true },
        _avg: { rating: true },
        _count: { rating: true },
      });
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: MOCK_PRODUCT_ID },
        data: {
          averageRating: expect.any(Prisma.Decimal),
          totalReviews: 0,
        },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // addVendorReply
  // ---------------------------------------------------------------------------

  describe('addVendorReply', () => {
    it('should allow product vendor to reply', async () => {
      const reviewWithProduct = {
        ...mockReview,
        product: { id: MOCK_PRODUCT_ID, name: 'Test Product', vendorId: MOCK_VENDOR_ID },
      };
      const repliedReview = {
        ...mockReview,
        vendorReply: 'Thank you!',
        vendorRepliedAt: new Date(),
      };

      mockPrisma.review.findUnique.mockResolvedValue(reviewWithProduct);
      mockPrisma.review.update.mockResolvedValue(repliedReview);

      const result = await service.addVendorReply(
        MOCK_REVIEW_ID,
        MOCK_VENDOR_ID,
        { content: 'Thank you!' },
      );

      expect(result.vendorReply).toBe('Thank you!');
    });

    it('should allow targeted vendor to reply', async () => {
      const vendorReview = {
        ...mockReview,
        productId: null,
        product: null,
        targetUserId: MOCK_VENDOR_ID,
      };
      const repliedReview = {
        ...vendorReview,
        vendorReply: 'Thanks!',
        vendorRepliedAt: new Date(),
        targetUser: mockTargetUser,
      };

      mockPrisma.review.findUnique.mockResolvedValue(vendorReview);
      mockPrisma.review.update.mockResolvedValue(repliedReview);

      const result = await service.addVendorReply(
        MOCK_REVIEW_ID,
        MOCK_VENDOR_ID,
        { content: 'Thanks!' },
      );

      expect(result.vendorReply).toBe('Thanks!');
    });

    it('should throw ForbiddenException when vendor does not own the product', async () => {
      const reviewWithOtherVendor = {
        ...mockReview,
        product: { id: MOCK_PRODUCT_ID, name: 'Test Product', vendorId: 'other-vendor' },
      };

      mockPrisma.review.findUnique.mockResolvedValue(reviewWithOtherVendor);

      await expect(
        service.addVendorReply(MOCK_REVIEW_ID, MOCK_VENDOR_ID, {
          content: 'Reply',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when reply already exists', async () => {
      const alreadyRepliedReview = {
        ...mockReview,
        vendorReply: 'Existing reply',
        product: { id: MOCK_PRODUCT_ID, name: 'Test Product', vendorId: MOCK_VENDOR_ID },
      };

      mockPrisma.review.findUnique.mockResolvedValue(alreadyRepliedReview);

      await expect(
        service.addVendorReply(MOCK_REVIEW_ID, MOCK_VENDOR_ID, {
          content: 'Another reply',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ---------------------------------------------------------------------------
  // getProductReviewStats
  // ---------------------------------------------------------------------------

  describe('getProductReviewStats', () => {
    it('should return correct distribution', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 3.5 },
        _count: { rating: 10 },
      });
      mockPrisma.review.groupBy.mockResolvedValue([
        { rating: 1, _count: { rating: 1 } },
        { rating: 2, _count: { rating: 1 } },
        { rating: 3, _count: { rating: 2 } },
        { rating: 4, _count: { rating: 3 } },
        { rating: 5, _count: { rating: 3 } },
      ]);

      const result = await service.getProductReviewStats(MOCK_PRODUCT_ID);

      expect(result.averageRating).toBe(3.5);
      expect(result.totalReviews).toBe(10);
      expect(result.ratingDistribution).toEqual({
        1: 1,
        2: 1,
        3: 2,
        4: 3,
        5: 3,
      });
    });

    it('should return zeroes when no reviews exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      });
      mockPrisma.review.groupBy.mockResolvedValue([]);

      const result = await service.getProductReviewStats(MOCK_PRODUCT_ID);

      expect(result.averageRating).toBe(0);
      expect(result.totalReviews).toBe(0);
      expect(result.ratingDistribution).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      });
    });

    it('should throw NotFoundException when product does not exist', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.getProductReviewStats('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // moderateReview
  // ---------------------------------------------------------------------------

  describe('moderateReview', () => {
    it('should hide a review and recalculate ratings', async () => {
      const hiddenReview = { ...mockReview, isVisible: false };

      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.update.mockResolvedValue(hiddenReview);
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      });
      mockPrisma.product.update.mockResolvedValue(mockProduct);

      const result = await service.moderateReview(
        MOCK_REVIEW_ID,
        MOCK_ADMIN_ID,
        false,
      );

      expect(mockPrisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isVisible: false },
        }),
      );
      expect(mockPrisma.review.aggregate).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should show a hidden review and recalculate ratings', async () => {
      const hiddenReview = { ...mockReview, isVisible: false };
      const shownReview = { ...mockReview, isVisible: true };

      mockPrisma.review.findUnique.mockResolvedValue(hiddenReview);
      mockPrisma.review.update.mockResolvedValue(shownReview);
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 4 },
        _count: { rating: 1 },
      });
      mockPrisma.product.update.mockResolvedValue(mockProduct);

      await service.moderateReview(MOCK_REVIEW_ID, MOCK_ADMIN_ID, true);

      expect(mockPrisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isVisible: true },
        }),
      );
    });

    it('should throw NotFoundException for non-existent review', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(null);

      await expect(
        service.moderateReview('non-existent', MOCK_ADMIN_ID, false),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // listReviews
  // ---------------------------------------------------------------------------

  describe('listReviews', () => {
    it('should return paginated reviews filtered by product', async () => {
      mockPrisma.review.findMany.mockResolvedValue([mockReview]);
      mockPrisma.review.count.mockResolvedValue(1);

      const result = await service.listReviews({
        page: 1,
        limit: 20,
        productId: MOCK_PRODUCT_ID,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            productId: MOCK_PRODUCT_ID,
            isVisible: true,
          }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // markHelpful
  // ---------------------------------------------------------------------------

  describe('markHelpful', () => {
    it('should increment helpfulCount', async () => {
      const helpfulReview = { ...mockReview, helpfulCount: 1 };

      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      mockPrisma.review.update.mockResolvedValue(helpfulReview);

      const result = await service.markHelpful(MOCK_REVIEW_ID, MOCK_AUTHOR_ID);

      expect(result.helpfulCount).toBe(1);
      expect(mockPrisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { helpfulCount: { increment: 1 } },
        }),
      );
    });

    it('should throw NotFoundException for non-existent review', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(null);

      await expect(
        service.markHelpful('non-existent', MOCK_AUTHOR_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
