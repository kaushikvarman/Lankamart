import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '@/common/prisma/prisma.service';
import { UsersService } from './users.service';

const mockVendorProfile = {
  id: 'vendor-profile-1',
  userId: 'user-vendor-1',
  businessName: 'Ceylon Spices Co.',
  businessSlug: 'ceylon-spices-co',
  description: 'Premium spices from Sri Lanka',
  logoUrl: 'https://cdn.example.com/logo.png',
  bannerUrl: null,
  businessRegNo: null,
  gstNumber: null,
  vatNumber: null,
  tier: 'FREE' as const,
  kycStatus: 'NOT_SUBMITTED' as const,
  isVerified: true,
  commissionRate: new Decimal(5.0),
  country: 'LK',
  city: 'Colombo',
  website: 'https://ceylonspices.com',
  yearEstablished: 2018,
  employeeCount: '11-50',
  mainProducts: 'cinnamon,pepper,cardamom',
  certifications: null,
  averageRating: new Decimal(4.5),
  totalReviews: 128,
  totalSales: 500,
  responseTimeHrs: new Decimal(2.5),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-06-01'),
};

const makeMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  email: 'buyer@example.com',
  passwordHash: 'hashed',
  role: UserRole.BUYER,
  status: UserStatus.ACTIVE,
  emailVerified: true,
  phone: '+94771234567',
  phoneVerified: false,
  firstName: 'Kamal',
  lastName: 'Perera',
  avatarUrl: null,
  lastLoginAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-06-01'),
  deletedAt: null,
  vendorProfile: null,
  ...overrides,
});

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  vendorProfile: {
    findUnique: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a UserResponseDto when user exists', async () => {
      const user = makeMockUser();
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findById('user-1');

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('buyer@example.com');
      expect(result.firstName).toBe('Kamal');
      expect(result.lastName).toBe('Perera');
      expect(result.role).toBe(UserRole.BUYER);
      expect(result.status).toBe(UserStatus.ACTIVE);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1', deletedAt: null },
        include: { vendorProfile: true },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('should return UserResponseDto when user exists', async () => {
      const user = makeMockUser();
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findByEmail('buyer@example.com');

      expect(result).not.toBeNull();
      expect(result!.email).toBe('buyer@example.com');
    });

    it('should return null when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('nobody@example.com');

      expect(result).toBeNull();
    });

    it('should return null when user is soft-deleted', async () => {
      const user = makeMockUser({ deletedAt: new Date() });
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.findByEmail('buyer@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('should return profile for a buyer without vendor profile', async () => {
      const user = makeMockUser();
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.getProfile('user-1');

      expect(result.id).toBe('user-1');
      expect(result.vendorProfile).toBeUndefined();
    });

    it('should return profile for a vendor with vendor profile', async () => {
      const user = makeMockUser({
        id: 'user-vendor-1',
        role: UserRole.VENDOR,
        vendorProfile: mockVendorProfile,
      });
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await service.getProfile('user-vendor-1');

      expect(result.id).toBe('user-vendor-1');
      expect(result.role).toBe(UserRole.VENDOR);
      expect(result.vendorProfile).toBeDefined();
      expect(result.vendorProfile!.businessName).toBe('Ceylon Spices Co.');
      expect(result.vendorProfile!.averageRating).toBe(4.5);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update and return the updated user profile', async () => {
      const user = makeMockUser();
      const updatedUser = makeMockUser({ firstName: 'Nimal' });

      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-1', {
        firstName: 'Nimal',
      });

      expect(result.firstName).toBe('Nimal');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { firstName: 'Nimal' },
        include: { vendorProfile: true },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile('nonexistent', { firstName: 'Nimal' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should only include provided fields in the update', async () => {
      const user = makeMockUser();
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(user);

      await service.updateProfile('user-1', { phone: '+94771111111' });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { phone: '+94771111111' },
        include: { vendorProfile: true },
      });
    });
  });

  describe('getPublicVendorProfile', () => {
    it('should return vendor public profile by slug', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue({
        ...mockVendorProfile,
        user: { deletedAt: null, status: UserStatus.ACTIVE },
      });

      const result = await service.getPublicVendorProfile('ceylon-spices-co');

      expect(result.businessName).toBe('Ceylon Spices Co.');
      expect(result.businessSlug).toBe('ceylon-spices-co');
      expect(result.isVerified).toBe(true);
      expect(result.averageRating).toBe(4.5);
    });

    it('should throw NotFoundException when vendor slug does not exist', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.getPublicVendorProfile('nonexistent-slug'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when vendor user is soft-deleted', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue({
        ...mockVendorProfile,
        user: { deletedAt: new Date(), status: UserStatus.ACTIVE },
      });

      await expect(
        service.getPublicVendorProfile('ceylon-spices-co'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when vendor user is not active', async () => {
      prisma.vendorProfile.findUnique.mockResolvedValue({
        ...mockVendorProfile,
        user: { deletedAt: null, status: UserStatus.SUSPENDED },
      });

      await expect(
        service.getPublicVendorProfile('ceylon-spices-co'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listUsers', () => {
    it('should return paginated users with default pagination', async () => {
      const users = [makeMockUser(), makeMockUser({ id: 'user-2', email: 'user2@example.com' })];
      prisma.user.findMany.mockResolvedValue(users);
      prisma.user.count.mockResolvedValue(2);

      const result = await service.listUsers({
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNext).toBe(false);
      expect(result.meta.hasPrev).toBe(false);
    });

    it('should apply role filter', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.listUsers({
        page: 1,
        limit: 20,
        role: UserRole.VENDOR,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: UserRole.VENDOR }),
        }),
      );
    });

    it('should apply status filter', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.listUsers({
        page: 1,
        limit: 20,
        status: UserStatus.SUSPENDED,
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: UserStatus.SUSPENDED }),
        }),
      );
    });

    it('should apply search filter across email, firstName, lastName', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.listUsers({
        page: 1,
        limit: 20,
        search: 'kamal',
      });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { email: { contains: 'kamal', mode: 'insensitive' } },
              { firstName: { contains: 'kamal', mode: 'insensitive' } },
              { lastName: { contains: 'kamal', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should calculate pagination meta correctly', async () => {
      prisma.user.findMany.mockResolvedValue([makeMockUser()]);
      prisma.user.count.mockResolvedValue(45);

      const result = await service.listUsers({
        page: 2,
        limit: 20,
      });

      expect(result.meta.total).toBe(45);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.hasNext).toBe(true);
      expect(result.meta.hasPrev).toBe(true);
    });

    it('should handle last page correctly', async () => {
      prisma.user.findMany.mockResolvedValue([makeMockUser()]);
      prisma.user.count.mockResolvedValue(45);

      const result = await service.listUsers({
        page: 3,
        limit: 20,
      });

      expect(result.meta.hasNext).toBe(false);
      expect(result.meta.hasPrev).toBe(true);
    });
  });

  describe('adminUpdateUser', () => {
    it('should update user status', async () => {
      const user = makeMockUser();
      const updatedUser = makeMockUser({ status: UserStatus.SUSPENDED });

      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.adminUpdateUser('user-1', {
        status: UserStatus.SUSPENDED,
      });

      expect(result.status).toBe(UserStatus.SUSPENDED);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { status: UserStatus.SUSPENDED },
        include: { vendorProfile: true },
      });
    });

    it('should update user role', async () => {
      const user = makeMockUser();
      const updatedUser = makeMockUser({ role: UserRole.VENDOR });

      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.adminUpdateUser('user-1', {
        role: UserRole.VENDOR,
      });

      expect(result.role).toBe(UserRole.VENDOR);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.adminUpdateUser('nonexistent', {
          status: UserStatus.SUSPENDED,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user by setting deletedAt', async () => {
      const user = makeMockUser();
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue({
        ...user,
        deletedAt: new Date(),
      });

      const result = await service.deleteUser('user-1');

      expect(result.message).toContain('user-1');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteUser('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when user is already deleted', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteUser('already-deleted')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
