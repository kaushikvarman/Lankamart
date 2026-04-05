import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { KycStatus, Prisma, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '@/common/prisma/prisma.service';
import { generateSlug } from '@/common/utils/slug';
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

interface KycDocumentRecord {
  id: string;
  userId: string;
  type: string;
  fileName: string;
  fileUrl: string;
  status: KycStatus;
  reviewNote: string | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PayoutAccountRecord {
  id: string;
  vendorProfileId: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingCode: string | null;
  swiftCode: string | null;
  currency: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const REQUIRED_KYC_TYPES = ['business_registration', 'id_proof'] as const;

@Injectable()
export class VendorsService {
  private readonly logger = new Logger(VendorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // PROFILE
  // ---------------------------------------------------------------------------

  async createProfile(
    userId: string,
    dto: CreateVendorProfileDto,
  ): Promise<VendorProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    if (user.role !== UserRole.VENDOR) {
      throw new ForbiddenException('Only users with VENDOR role can create a vendor profile');
    }

    const existingProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new ConflictException('Vendor profile already exists for this user');
    }

    const businessSlug = generateSlug(dto.businessName);

    const vendorProfile = await this.prisma.vendorProfile.create({
      data: {
        userId,
        businessName: dto.businessName,
        businessSlug,
        description: dto.description,
        businessRegNo: dto.businessRegNo,
        gstNumber: dto.gstNumber,
        vatNumber: dto.vatNumber,
        country: dto.country,
        city: dto.city,
        website: dto.website,
        yearEstablished: dto.yearEstablished,
        employeeCount: dto.employeeCount,
        mainProducts: dto.mainProducts,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    this.logger.log(`Vendor profile created: ${vendorProfile.businessName} (${vendorProfile.id})`);

    return VendorProfileResponseDto.fromEntity(vendorProfile);
  }

  async getMyProfile(userId: string): Promise<VendorProfileResponseDto> {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!vendorProfile) {
      throw new NotFoundException('Vendor profile not found. Please create one first.');
    }

    return VendorProfileResponseDto.fromEntity(vendorProfile);
  }

  async updateProfile(
    userId: string,
    dto: UpdateVendorProfileDto,
  ): Promise<VendorProfileResponseDto> {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      throw new NotFoundException('Vendor profile not found');
    }

    const updateData: Prisma.VendorProfileUpdateInput = {};

    if (dto.businessName !== undefined) {
      updateData.businessName = dto.businessName;
      updateData.businessSlug = generateSlug(dto.businessName);
    }
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.businessRegNo !== undefined) updateData.businessRegNo = dto.businessRegNo;
    if (dto.gstNumber !== undefined) updateData.gstNumber = dto.gstNumber;
    if (dto.vatNumber !== undefined) updateData.vatNumber = dto.vatNumber;
    if (dto.country !== undefined) updateData.country = dto.country;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.website !== undefined) updateData.website = dto.website;
    if (dto.yearEstablished !== undefined) updateData.yearEstablished = dto.yearEstablished;
    if (dto.employeeCount !== undefined) updateData.employeeCount = dto.employeeCount;
    if (dto.mainProducts !== undefined) updateData.mainProducts = dto.mainProducts;

    const updated = await this.prisma.vendorProfile.update({
      where: { userId },
      data: updateData,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    this.logger.log(`Vendor profile updated: ${updated.id}`);

    return VendorProfileResponseDto.fromEntity(updated);
  }

  async getProfileBySlug(slug: string): Promise<PublicVendorProfileResponseDto> {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { businessSlug: slug },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            deletedAt: true,
            status: true,
          },
        },
      },
    });

    if (
      !vendorProfile ||
      vendorProfile.user.deletedAt !== null ||
      vendorProfile.user.status !== 'ACTIVE'
    ) {
      throw new NotFoundException(`Vendor with slug "${slug}" not found`);
    }

    return PublicVendorProfileResponseDto.fromEntity(vendorProfile);
  }

  async listVendors(
    query: QueryVendorsDto,
  ): Promise<PaginatedResponse<VendorProfileResponseDto>> {
    const { page, limit, country, tier, kycStatus, isVerified, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.VendorProfileWhereInput = {
      ...(country && { country }),
      ...(tier && { tier }),
      ...(kycStatus && { kycStatus }),
      ...(isVerified !== undefined && { isVerified }),
      ...(search && {
        businessName: { contains: search, mode: 'insensitive' as const },
      }),
    };

    const [vendors, total] = await Promise.all([
      this.prisma.vendorProfile.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vendorProfile.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: vendors.map((v) => VendorProfileResponseDto.fromEntity(v)),
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

  // ---------------------------------------------------------------------------
  // KYC DOCUMENTS
  // ---------------------------------------------------------------------------

  async submitKycDocument(
    userId: string,
    dto: CreateKycDocumentDto,
  ): Promise<KycDocumentRecord> {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      throw new NotFoundException('Vendor profile not found. Please create a profile first.');
    }

    const kycDocument = await this.prisma.kycDocument.create({
      data: {
        userId,
        type: dto.type,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        status: KycStatus.PENDING_REVIEW,
      },
    });

    if (vendorProfile.kycStatus === KycStatus.NOT_SUBMITTED) {
      await this.prisma.vendorProfile.update({
        where: { userId },
        data: { kycStatus: KycStatus.PENDING_REVIEW },
      });
    }

    this.logger.log(`KYC document submitted: ${kycDocument.type} by user ${userId}`);

    return kycDocument;
  }

  async getMyKycDocuments(userId: string): Promise<KycDocumentRecord[]> {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      throw new NotFoundException('Vendor profile not found');
    }

    return this.prisma.kycDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewKycDocument(
    documentId: string,
    adminUserId: string,
    dto: ReviewKycDocumentDto,
  ): Promise<KycDocumentRecord> {
    const document = await this.prisma.kycDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`KYC document with ID "${documentId}" not found`);
    }

    if (document.status !== KycStatus.PENDING_REVIEW) {
      throw new BadRequestException('This document has already been reviewed');
    }

    const updatedDocument = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.kycDocument.update({
        where: { id: documentId },
        data: {
          status: dto.status,
          reviewNote: dto.reviewNote,
          reviewedAt: new Date(),
          reviewedBy: adminUserId,
        },
      });

      if (dto.status === KycStatus.APPROVED) {
        const requiredTypes = ['business_registration', 'id_proof'];
        const allDocs = await tx.kycDocument.findMany({
          where: { userId: document.userId },
        });

        const allRequiredApproved = requiredTypes.every((type) =>
          allDocs.some((d) => d.type === type && d.status === KycStatus.APPROVED),
        );

        if (allRequiredApproved) {
          await tx.vendorProfile.updateMany({
            where: { userId: document.userId },
            data: {
              kycStatus: KycStatus.APPROVED,
              isVerified: true,
            },
          });
        }
      }

      if (dto.status === KycStatus.REJECTED) {
        await tx.vendorProfile.updateMany({
          where: { userId: document.userId },
          data: { kycStatus: KycStatus.REJECTED },
        });
      }

      return updated;
    });

    this.logger.log(
      `KYC document ${documentId} reviewed by ${adminUserId}: ${dto.status}`,
    );

    return updatedDocument;
  }

  async listPendingKyc(
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<VendorProfileResponseDto>> {
    const skip = (page - 1) * limit;

    const where: Prisma.VendorProfileWhereInput = {
      kycStatus: KycStatus.PENDING_REVIEW,
    };

    const [vendors, total] = await Promise.all([
      this.prisma.vendorProfile.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.vendorProfile.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: vendors.map((v) => VendorProfileResponseDto.fromEntity(v)),
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

  private async checkAndUpdateVendorVerification(userId: string): Promise<void> {
    const documents = await this.prisma.kycDocument.findMany({
      where: { userId },
    });

    const approvedTypes = new Set(
      documents
        .filter((d) => d.status === KycStatus.APPROVED)
        .map((d) => d.type),
    );

    const allRequiredApproved = REQUIRED_KYC_TYPES.every((type) =>
      approvedTypes.has(type),
    );

    if (allRequiredApproved) {
      await this.prisma.vendorProfile.updateMany({
        where: { userId },
        data: {
          kycStatus: KycStatus.APPROVED,
          isVerified: true,
        },
      });

      this.logger.log(`Vendor ${userId} fully verified - all required KYC documents approved`);
    }
  }

  // ---------------------------------------------------------------------------
  // PAYOUT ACCOUNTS
  // ---------------------------------------------------------------------------

  async createPayoutAccount(
    userId: string,
    dto: CreatePayoutAccountDto,
  ): Promise<PayoutAccountRecord> {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      throw new NotFoundException('Vendor profile not found. Please create a profile first.');
    }

    const isDefault = dto.isDefault ?? false;

    const payoutAccount = await this.prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.vendorPayoutAccount.updateMany({
          where: { vendorProfileId: vendorProfile.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      const existingAccounts = await tx.vendorPayoutAccount.count({
        where: { vendorProfileId: vendorProfile.id },
      });

      return tx.vendorPayoutAccount.create({
        data: {
          vendorProfileId: vendorProfile.id,
          bankName: dto.bankName,
          accountName: dto.accountName,
          accountNumber: dto.accountNumber,
          routingCode: dto.routingCode,
          swiftCode: dto.swiftCode,
          currency: dto.currency,
          isDefault: isDefault || existingAccounts === 0,
        },
      });
    });

    this.logger.log(`Payout account created: ${payoutAccount.id} for vendor ${vendorProfile.id}`);

    return payoutAccount;
  }

  async getPayoutAccounts(userId: string): Promise<PayoutAccountRecord[]> {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      throw new NotFoundException('Vendor profile not found');
    }

    return this.prisma.vendorPayoutAccount.findMany({
      where: { vendorProfileId: vendorProfile.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async updatePayoutAccount(
    userId: string,
    accountId: string,
    dto: UpdatePayoutAccountDto,
  ): Promise<PayoutAccountRecord> {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      throw new NotFoundException('Vendor profile not found');
    }

    const account = await this.prisma.vendorPayoutAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException(`Payout account with ID "${accountId}" not found`);
    }

    if (account.vendorProfileId !== vendorProfile.id) {
      throw new ForbiddenException('This payout account does not belong to your vendor profile');
    }

    if (dto.isDefault === true) {
      await this.prisma.vendorPayoutAccount.updateMany({
        where: {
          vendorProfileId: vendorProfile.id,
          isDefault: true,
          id: { not: accountId },
        },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.vendorPayoutAccount.update({
      where: { id: accountId },
      data: {
        ...(dto.bankName !== undefined && { bankName: dto.bankName }),
        ...(dto.accountName !== undefined && { accountName: dto.accountName }),
        ...(dto.accountNumber !== undefined && { accountNumber: dto.accountNumber }),
        ...(dto.routingCode !== undefined && { routingCode: dto.routingCode }),
        ...(dto.swiftCode !== undefined && { swiftCode: dto.swiftCode }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });

    this.logger.log(`Payout account updated: ${accountId}`);

    return updated;
  }

  async deletePayoutAccount(
    userId: string,
    accountId: string,
  ): Promise<{ message: string }> {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      throw new NotFoundException('Vendor profile not found');
    }

    const account = await this.prisma.vendorPayoutAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException(`Payout account with ID "${accountId}" not found`);
    }

    if (account.vendorProfileId !== vendorProfile.id) {
      throw new ForbiddenException('This payout account does not belong to your vendor profile');
    }

    const totalAccounts = await this.prisma.vendorPayoutAccount.count({
      where: { vendorProfileId: vendorProfile.id },
    });

    if (totalAccounts <= 1) {
      throw new BadRequestException(
        'Cannot delete the only payout account. Add another account before deleting this one.',
      );
    }

    if (account.isDefault) {
      throw new BadRequestException(
        'Cannot delete the default payout account. Set another account as default first.',
      );
    }

    await this.prisma.vendorPayoutAccount.delete({
      where: { id: accountId },
    });

    this.logger.log(`Payout account deleted: ${accountId}`);

    return { message: `Payout account "${accountId}" has been deleted` };
  }

  // ---------------------------------------------------------------------------
  // DASHBOARD STATS
  // ---------------------------------------------------------------------------

  async getDashboardStats(userId: string): Promise<VendorStatsDto> {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      throw new NotFoundException('Vendor profile not found');
    }

    const [totalProducts, orderStats, pendingOrders] = await Promise.all([
      this.prisma.product.count({
        where: { vendorId: userId },
      }),
      this.prisma.orderItem.aggregate({
        where: { vendorId: userId },
        _count: { id: true },
        _sum: { totalPrice: true },
      }),
      this.prisma.orderItem.count({
        where: { vendorId: userId, status: 'PENDING' },
      }),
    ]);

    const totalOrders = orderStats._count.id;
    const totalRevenue = orderStats._sum.totalPrice instanceof Decimal
      ? orderStats._sum.totalPrice.toNumber()
      : Number(orderStats._sum.totalPrice ?? 0);

    const averageRating = vendorProfile.averageRating instanceof Decimal
      ? vendorProfile.averageRating.toNumber()
      : Number(vendorProfile.averageRating);

    const profileCompleteness = this.calculateProfileCompleteness(vendorProfile);

    return VendorStatsDto.create({
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingOrders,
      averageRating,
      totalReviews: vendorProfile.totalReviews,
      profileCompleteness,
    });
  }

  private calculateProfileCompleteness(profile: {
    businessName: string;
    description: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    businessRegNo: string | null;
    country: string;
    city: string | null;
    website: string | null;
    yearEstablished: number | null;
    employeeCount: string | null;
    mainProducts: string | null;
    isVerified: boolean;
  }): number {
    const fields = [
      { value: profile.businessName, weight: 10 },
      { value: profile.description, weight: 15 },
      { value: profile.logoUrl, weight: 10 },
      { value: profile.bannerUrl, weight: 5 },
      { value: profile.businessRegNo, weight: 10 },
      { value: profile.country, weight: 5 },
      { value: profile.city, weight: 5 },
      { value: profile.website, weight: 5 },
      { value: profile.yearEstablished, weight: 5 },
      { value: profile.employeeCount, weight: 5 },
      { value: profile.mainProducts, weight: 10 },
      { value: profile.isVerified ? 'verified' : null, weight: 15 },
    ];

    const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0);
    const earnedWeight = fields.reduce((sum, f) => {
      return sum + (f.value !== null && f.value !== undefined ? f.weight : 0);
    }, 0);

    return Math.round((earnedWeight / totalWeight) * 100);
  }
}
