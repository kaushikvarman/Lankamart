import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { KycStatus, UserRole, UserStatus, VendorTier } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '@/common/prisma/prisma.service';
import { VendorsService } from './vendors.service';
import { CreateVendorProfileDto } from './dto/create-vendor-profile.dto';
import { CreateKycDocumentDto } from './dto/create-kyc-document.dto';
import { CreatePayoutAccountDto } from './dto/create-payout-account.dto';
import { ReviewKycDocumentDto } from './dto/review-kyc-document.dto';

const MOCK_USER_ID = 'user-vendor-001';
const MOCK_ADMIN_ID = 'user-admin-001';
const MOCK_PROFILE_ID = 'profile-001';
const MOCK_DOC_ID = 'kyc-doc-001';
const MOCK_ACCOUNT_ID = 'payout-001';
const MOCK_ACCOUNT_ID_2 = 'payout-002';

const mockVendorUser = {
  id: MOCK_USER_ID,
  email: 'vendor@example.com',
  passwordHash: 'hashed',
  role: UserRole.VENDOR,
  status: UserStatus.ACTIVE,
  emailVerified: true,
  phone: '+94771234567',
  phoneVerified: false,
  firstName: 'Kamal',
  lastName: 'Perera',
  avatarUrl: null,
  lastLoginAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  deletedAt: null,
};

const mockBuyerUser = {
  ...mockVendorUser,
  id: 'user-buyer-001',
  email: 'buyer@example.com',
  role: UserRole.BUYER,
};

const mockVendorProfile = {
  id: MOCK_PROFILE_ID,
  userId: MOCK_USER_ID,
  businessName: 'Ceylon Spices Co.',
  businessSlug: 'ceylon-spices-co-abc123',
  description: 'Premium spice exporter',
  logoUrl: null,
  bannerUrl: null,
  businessRegNo: 'PV00012345',
  gstNumber: null,
  vatNumber: '124456789-7000',
  tier: VendorTier.FREE,
  kycStatus: KycStatus.NOT_SUBMITTED,
  isVerified: false,
  commissionRate: new Decimal('5.00'),
  country: 'LK',
  city: 'Colombo',
  website: 'https://ceylonspices.lk',
  yearEstablished: 2018,
  employeeCount: '11-50',
  mainProducts: 'Cinnamon, Black Pepper',
  certifications: null,
  averageRating: new Decimal('4.50'),
  totalReviews: 128,
  totalSales: 500,
  responseTimeHrs: new Decimal('2.5'),
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockVendorProfileWithUser = {
  ...mockVendorProfile,
  user: {
    firstName: 'Kamal',
    lastName: 'Perera',
    email: 'vendor@example.com',
  },
};

const mockKycDocument = {
  id: MOCK_DOC_ID,
  userId: MOCK_USER_ID,
  type: 'business_registration',
  fileName: 'br.pdf',
  fileUrl: 'https://storage.example.com/kyc/br.pdf',
  status: KycStatus.PENDING_REVIEW,
  reviewNote: null,
  reviewedAt: null,
  reviewedBy: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockPayoutAccount = {
  id: MOCK_ACCOUNT_ID,
  vendorProfileId: MOCK_PROFILE_ID,
  bankName: 'Bank of Ceylon',
  accountName: 'Ceylon Spices Co.',
  accountNumber: '0012345678',
  routingCode: null,
  swiftCode: 'BABORSLX',
  currency: 'LKR',
  isDefault: true,
  isVerified: false,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

describe('VendorsService', () => {
  let service: VendorsService;
  let prisma: {
    user: { findUnique: jest.Mock };
    vendorProfile: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    kycDocument: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    vendorPayoutAccount: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    product: { count: jest.Mock };
    orderItem: { aggregate: jest.Mock; count: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      vendorProfile: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      kycDocument: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      vendorPayoutAccount: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      product: { count: jest.fn() },
      orderItem: { aggregate: jest.fn(), count: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<VendorsService>(VendorsService);
  });

  // ---------------------------------------------------------------------------
  // createProfile
  // ---------------------------------------------------------------------------
  describe('createProfile', () => {
    const dto: CreateVendorProfileDto = {
      businessName: 'Ceylon Spices Co.',
      description: 'Premium spice exporter',
      country: 'LK',
      city: 'Colombo',
    };

    it('should create a vendor profile successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(mockVendorUser);
      prisma.vendorProfile.findUnique.mockResolvedValue(null);
      prisma.vendorProfile.create.mockResolvedValue(mockVendorProfileWithUser);

      const result = await service.createProfile(MOCK_USER_ID, dto);

      expect(result.businessName).toBe('Ceylon Spices Co.');
      expect(result.firstName).toBe('Kamal');
      expect(result.lastName).toBe('Perera');
      expect(prisma.vendorProfile.create).toHaveBeenCalledTimes(1);

      const createCall = prisma.vendorProfile.create.mock.calls[0][0];
      expect(createCall.data.userId).toBe(MOCK_USER_ID);
      expect(createCall.data.businessName).toBe('Ceylon Spices Co.');
      expect(createCall.data.businessSlug).toMatch(/^ceylon-spices-co-[a-f0-9]{6}$/);
    });

    it('should throw ForbiddenException for non-vendor user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockBuyerUser);

      await expect(
        service.createProfile('user-buyer-001', dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if profile already exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockVendorUser);
      prisma.vendorProfile.findUnique.mockResolvedValue(mockVendorProfile);

      await expect(
        service.createProfile(MOCK_USER_ID, dto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createProfile('nonexistent', dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // updateProfile
  // ---------------------------------------------------------------------------
  describe('updateProfile', () => {
    it('should update vendor profile', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(mockVendorProfile);
      prisma.vendorProfile.update.mockResolvedValue({
        ...mockVendorProfileWithUser,
        description: 'Updated description',
      });

      const result = await service.updateProfile(MOCK_USER_ID, {
        description: 'Updated description',
      });

      expect(result.description).toBe('Updated description');
      expect(prisma.vendorProfile.update).toHaveBeenCalledTimes(1);
    });

    it('should regenerate slug when businessName changes', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(mockVendorProfile);
      prisma.vendorProfile.update.mockResolvedValue({
        ...mockVendorProfileWithUser,
        businessName: 'New Name',
        businessSlug: 'new-name-abc123',
      });

      await service.updateProfile(MOCK_USER_ID, {
        businessName: 'New Name',
      });

      const updateCall = prisma.vendorProfile.update.mock.calls[0][0];
      expect(updateCall.data.businessSlug).toMatch(/^new-name-[a-f0-9]{6}$/);
      expect(updateCall.data.businessName).toBe('New Name');
    });

    it('should throw NotFoundException if profile not found', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile(MOCK_USER_ID, { description: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // KYC Flow
  // ---------------------------------------------------------------------------
  describe('submitKycDocument', () => {
    const dto: CreateKycDocumentDto = {
      type: 'business_registration',
      fileName: 'br.pdf',
      fileUrl: 'https://storage.example.com/kyc/br.pdf',
    };

    it('should submit a KYC document and update kycStatus', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(mockVendorProfile);
      prisma.kycDocument.create.mockResolvedValue(mockKycDocument);
      prisma.vendorProfile.update.mockResolvedValue({
        ...mockVendorProfile,
        kycStatus: KycStatus.PENDING_REVIEW,
      });

      const result = await service.submitKycDocument(MOCK_USER_ID, dto);

      expect(result.type).toBe('business_registration');
      expect(result.status).toBe(KycStatus.PENDING_REVIEW);
      expect(prisma.vendorProfile.update).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID },
        data: { kycStatus: KycStatus.PENDING_REVIEW },
      });
    });

    it('should not update kycStatus if already PENDING_REVIEW', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue({
        ...mockVendorProfile,
        kycStatus: KycStatus.PENDING_REVIEW,
      });
      prisma.kycDocument.create.mockResolvedValue(mockKycDocument);

      await service.submitKycDocument(MOCK_USER_ID, dto);

      expect(prisma.vendorProfile.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if no vendor profile', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.submitKycDocument(MOCK_USER_ID, dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reviewKycDocument', () => {
    it('should approve a KYC document', async () => {
      const approveDto: ReviewKycDocumentDto = {
        status: KycStatus.APPROVED,
        reviewNote: 'Document verified',
      };

      prisma.kycDocument.findUnique.mockResolvedValue(mockKycDocument);
      prisma.kycDocument.update.mockResolvedValue({
        ...mockKycDocument,
        status: KycStatus.APPROVED,
        reviewNote: 'Document verified',
        reviewedAt: new Date(),
        reviewedBy: MOCK_ADMIN_ID,
      });
      // checkAndUpdateVendorVerification: not all required docs approved yet
      prisma.kycDocument.findMany.mockResolvedValue([
        { ...mockKycDocument, status: KycStatus.APPROVED },
      ]);

      const result = await service.reviewKycDocument(
        MOCK_DOC_ID,
        MOCK_ADMIN_ID,
        approveDto,
      );

      expect(result.status).toBe(KycStatus.APPROVED);
      expect(result.reviewedBy).toBe(MOCK_ADMIN_ID);
    });

    it('should reject a KYC document and update vendor kycStatus', async () => {
      const rejectDto: ReviewKycDocumentDto = {
        status: KycStatus.REJECTED,
        reviewNote: 'Blurry document',
      };

      prisma.kycDocument.findUnique.mockResolvedValue(mockKycDocument);
      prisma.kycDocument.update.mockResolvedValue({
        ...mockKycDocument,
        status: KycStatus.REJECTED,
        reviewNote: 'Blurry document',
        reviewedAt: new Date(),
        reviewedBy: MOCK_ADMIN_ID,
      });
      prisma.vendorProfile.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.reviewKycDocument(
        MOCK_DOC_ID,
        MOCK_ADMIN_ID,
        rejectDto,
      );

      expect(result.status).toBe(KycStatus.REJECTED);
      expect(prisma.vendorProfile.updateMany).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID },
        data: { kycStatus: KycStatus.REJECTED },
      });
    });

    it('should fully verify vendor when all required docs approved', async () => {
      const approveDto: ReviewKycDocumentDto = {
        status: KycStatus.APPROVED,
      };

      prisma.kycDocument.findUnique.mockResolvedValue(mockKycDocument);
      prisma.kycDocument.update.mockResolvedValue({
        ...mockKycDocument,
        status: KycStatus.APPROVED,
      });
      prisma.kycDocument.findMany.mockResolvedValue([
        {
          ...mockKycDocument,
          type: 'business_registration',
          status: KycStatus.APPROVED,
        },
        {
          ...mockKycDocument,
          id: 'kyc-doc-002',
          type: 'id_proof',
          status: KycStatus.APPROVED,
        },
      ]);
      prisma.vendorProfile.updateMany.mockResolvedValue({ count: 1 });

      await service.reviewKycDocument(MOCK_DOC_ID, MOCK_ADMIN_ID, approveDto);

      expect(prisma.vendorProfile.updateMany).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID },
        data: {
          kycStatus: KycStatus.APPROVED,
          isVerified: true,
        },
      });
    });

    it('should throw BadRequestException if document already reviewed', async () => {
      prisma.kycDocument.findUnique.mockResolvedValue({
        ...mockKycDocument,
        status: KycStatus.APPROVED,
      });

      await expect(
        service.reviewKycDocument(MOCK_DOC_ID, MOCK_ADMIN_ID, {
          status: KycStatus.APPROVED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if document not found', async () => {
      prisma.kycDocument.findUnique.mockResolvedValue(null);

      await expect(
        service.reviewKycDocument('nonexistent', MOCK_ADMIN_ID, {
          status: KycStatus.APPROVED,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // Payout Accounts
  // ---------------------------------------------------------------------------
  describe('createPayoutAccount', () => {
    const dto: CreatePayoutAccountDto = {
      bankName: 'Bank of Ceylon',
      accountName: 'Ceylon Spices Co.',
      accountNumber: '0012345678',
      swiftCode: 'BABORSLX',
      currency: 'LKR',
      isDefault: false,
    };

    it('should create a payout account', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(mockVendorProfile);
      prisma.vendorPayoutAccount.count.mockResolvedValue(1);
      prisma.vendorPayoutAccount.create.mockResolvedValue(mockPayoutAccount);

      const result = await service.createPayoutAccount(MOCK_USER_ID, dto);

      expect(result.bankName).toBe('Bank of Ceylon');
      expect(prisma.vendorPayoutAccount.create).toHaveBeenCalledTimes(1);
    });

    it('should set as default if first account', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(mockVendorProfile);
      prisma.vendorPayoutAccount.count.mockResolvedValue(0);
      prisma.vendorPayoutAccount.create.mockResolvedValue({
        ...mockPayoutAccount,
        isDefault: true,
      });

      await service.createPayoutAccount(MOCK_USER_ID, { ...dto, isDefault: false });

      const createCall = prisma.vendorPayoutAccount.create.mock.calls[0][0];
      expect(createCall.data.isDefault).toBe(true);
    });

    it('should unset other defaults when creating with isDefault=true', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(mockVendorProfile);
      prisma.vendorPayoutAccount.updateMany.mockResolvedValue({ count: 1 });
      prisma.vendorPayoutAccount.count.mockResolvedValue(1);
      prisma.vendorPayoutAccount.create.mockResolvedValue({
        ...mockPayoutAccount,
        isDefault: true,
      });

      await service.createPayoutAccount(MOCK_USER_ID, { ...dto, isDefault: true });

      expect(prisma.vendorPayoutAccount.updateMany).toHaveBeenCalledWith({
        where: { vendorProfileId: MOCK_PROFILE_ID, isDefault: true },
        data: { isDefault: false },
      });
    });

    it('should throw NotFoundException if no vendor profile', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.createPayoutAccount(MOCK_USER_ID, dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePayoutAccount', () => {
    it('should update a payout account', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(mockVendorProfile);
      prisma.vendorPayoutAccount.findUnique.mockResolvedValue(mockPayoutAccount);
      prisma.vendorPayoutAccount.update.mockResolvedValue({
        ...mockPayoutAccount,
        bankName: 'Sampath Bank',
      });

      const result = await service.updatePayoutAccount(
        MOCK_USER_ID,
        MOCK_ACCOUNT_ID,
        { bankName: 'Sampath Bank' },
      );

      expect(result.bankName).toBe('Sampath Bank');
    });

    it('should throw ForbiddenException if account belongs to another vendor', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(mockVendorProfile);
      prisma.vendorPayoutAccount.findUnique.mockResolvedValue({
        ...mockPayoutAccount,
        vendorProfileId: 'other-profile-id',
      });

      await expect(
        service.updatePayoutAccount(MOCK_USER_ID, MOCK_ACCOUNT_ID, {
          bankName: 'test',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should unset other defaults when setting isDefault=true', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(mockVendorProfile);
      prisma.vendorPayoutAccount.findUnique.mockResolvedValue({
        ...mockPayoutAccount,
        isDefault: false,
      });
      prisma.vendorPayoutAccount.updateMany.mockResolvedValue({ count: 1 });
      prisma.vendorPayoutAccount.update.mockResolvedValue({
        ...mockPayoutAccount,
        isDefault: true,
      });

      await service.updatePayoutAccount(MOCK_USER_ID, MOCK_ACCOUNT_ID, {
        isDefault: true,
      });

      expect(prisma.vendorPayoutAccount.updateMany).toHaveBeenCalledWith({
        where: {
          vendorProfileId: MOCK_PROFILE_ID,
          isDefault: true,
          id: { not: MOCK_ACCOUNT_ID },
        },
        data: { isDefault: false },
      });
    });
  });

  describe('deletePayoutAccount', () => {
    it('should delete a non-default payout account', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(mockVendorProfile);
      prisma.vendorPayoutAccount.findUnique.mockResolvedValue({
        ...mockPayoutAccount,
        isDefault: false,
      });
      prisma.vendorPayoutAccount.count.mockResolvedValue(2);
      prisma.vendorPayoutAccount.delete.mockResolvedValue(mockPayoutAccount);

      const result = await service.deletePayoutAccount(
        MOCK_USER_ID,
        MOCK_ACCOUNT_ID,
      );

      expect(result.message).toContain('deleted');
      expect(prisma.vendorPayoutAccount.delete).toHaveBeenCalledWith({
        where: { id: MOCK_ACCOUNT_ID },
      });
    });

    it('should throw BadRequestException when deleting the only account', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(mockVendorProfile);
      prisma.vendorPayoutAccount.findUnique.mockResolvedValue({
        ...mockPayoutAccount,
        isDefault: false,
      });
      prisma.vendorPayoutAccount.count.mockResolvedValue(1);

      await expect(
        service.deletePayoutAccount(MOCK_USER_ID, MOCK_ACCOUNT_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when deleting default account', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(mockVendorProfile);
      prisma.vendorPayoutAccount.findUnique.mockResolvedValue({
        ...mockPayoutAccount,
        isDefault: true,
      });
      prisma.vendorPayoutAccount.count.mockResolvedValue(2);

      await expect(
        service.deletePayoutAccount(MOCK_USER_ID, MOCK_ACCOUNT_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if account belongs to another vendor', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(mockVendorProfile);
      prisma.vendorPayoutAccount.findUnique.mockResolvedValue({
        ...mockPayoutAccount,
        vendorProfileId: 'other-profile-id',
      });

      await expect(
        service.deletePayoutAccount(MOCK_USER_ID, MOCK_ACCOUNT_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ---------------------------------------------------------------------------
  // Dashboard Stats
  // ---------------------------------------------------------------------------
  describe('getDashboardStats', () => {
    it('should return vendor dashboard statistics', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(mockVendorProfile);
      prisma.product.count.mockResolvedValue(42);
      prisma.orderItem.aggregate.mockResolvedValue({
        _count: { id: 150 },
        _sum: { totalPrice: new Decimal('25000.50') },
      });
      prisma.orderItem.count.mockResolvedValue(5);

      const result = await service.getDashboardStats(MOCK_USER_ID);

      expect(result.totalProducts).toBe(42);
      expect(result.totalOrders).toBe(150);
      expect(result.totalRevenue).toBe(25000.5);
      expect(result.pendingOrders).toBe(5);
      expect(result.averageRating).toBe(4.5);
      expect(result.totalReviews).toBe(128);
      expect(result.profileCompleteness).toBeGreaterThan(0);
      expect(result.profileCompleteness).toBeLessThanOrEqual(100);
    });

    it('should handle zero stats gracefully', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue({
        ...mockVendorProfile,
        averageRating: new Decimal('0'),
        totalReviews: 0,
        totalSales: 0,
      });
      prisma.product.count.mockResolvedValue(0);
      prisma.orderItem.aggregate.mockResolvedValue({
        _count: { id: 0 },
        _sum: { totalPrice: null },
      });
      prisma.orderItem.count.mockResolvedValue(0);

      const result = await service.getDashboardStats(MOCK_USER_ID);

      expect(result.totalProducts).toBe(0);
      expect(result.totalOrders).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.pendingOrders).toBe(0);
      expect(result.averageRating).toBe(0);
      expect(result.totalReviews).toBe(0);
    });

    it('should throw NotFoundException if profile not found', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.getDashboardStats(MOCK_USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
