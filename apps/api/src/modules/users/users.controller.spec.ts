import { Test, TestingModule } from '@nestjs/testing';
import { UserRole, UserStatus } from '@prisma/client';
import { UsersController } from './users.controller';
import { UsersService, PaginatedResponse } from './users.service';
import { UserResponseDto, VendorPublicDto } from './dto';
import { JwtPayload } from '@/common/decorators/current-user.decorator';

const mockUserResponse: UserResponseDto = {
  id: 'user-1',
  email: 'buyer@example.com',
  firstName: 'Kamal',
  lastName: 'Perera',
  role: UserRole.BUYER,
  status: UserStatus.ACTIVE,
  phone: '+94771234567',
  avatarUrl: null,
  emailVerified: true,
  phoneVerified: false,
  createdAt: new Date('2024-01-01'),
};

const mockVendorPublic: VendorPublicDto = {
  id: 'vendor-1',
  businessName: 'Ceylon Spices Co.',
  businessSlug: 'ceylon-spices-co',
  description: 'Premium spices',
  logoUrl: null,
  bannerUrl: null,
  isVerified: true,
  averageRating: 4.5,
  totalReviews: 128,
  country: 'LK',
  city: 'Colombo',
  website: null,
  yearEstablished: 2018,
  createdAt: new Date('2024-01-01'),
};

const mockPaginatedResponse: PaginatedResponse<UserResponseDto> = {
  data: [mockUserResponse],
  meta: {
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  },
};

const mockUsersService = {
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  getPublicVendorProfile: jest.fn(),
  listUsers: jest.fn(),
  findById: jest.fn(),
  adminUpdateUser: jest.fn(),
  deleteUser: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;
  let service: typeof mockUsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);

    jest.clearAllMocks();
  });

  const jwtPayload: JwtPayload = {
    sub: 'user-1',
    email: 'buyer@example.com',
    role: UserRole.BUYER,
  };

  describe('GET /users/me', () => {
    it('should call usersService.getProfile with the current user ID', async () => {
      service.getProfile.mockResolvedValue(mockUserResponse);

      const result = await controller.getMyProfile(jwtPayload);

      expect(service.getProfile).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('PATCH /users/me', () => {
    it('should call usersService.updateProfile with user ID and DTO', async () => {
      const dto = { firstName: 'Nimal' };
      service.updateProfile.mockResolvedValue({
        ...mockUserResponse,
        firstName: 'Nimal',
      });

      const result = await controller.updateMyProfile(jwtPayload, dto);

      expect(service.updateProfile).toHaveBeenCalledWith('user-1', dto);
      expect(result.firstName).toBe('Nimal');
    });
  });

  describe('GET /users/vendors/:slug', () => {
    it('should call usersService.getPublicVendorProfile with slug', async () => {
      service.getPublicVendorProfile.mockResolvedValue(mockVendorPublic);

      const result = await controller.getPublicVendorProfile('ceylon-spices-co');

      expect(service.getPublicVendorProfile).toHaveBeenCalledWith(
        'ceylon-spices-co',
      );
      expect(result).toEqual(mockVendorPublic);
    });
  });

  describe('GET /users', () => {
    it('should call usersService.listUsers with query params', async () => {
      service.listUsers.mockResolvedValue(mockPaginatedResponse);

      const query = { page: 1, limit: 20, role: UserRole.BUYER };
      const result = await controller.listUsers(query);

      expect(service.listUsers).toHaveBeenCalledWith(query);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('GET /users/:id', () => {
    it('should call usersService.findById with the user ID', async () => {
      service.findById.mockResolvedValue(mockUserResponse);

      const result = await controller.getUserById('user-1');

      expect(service.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should call usersService.adminUpdateUser with ID and DTO', async () => {
      const dto = { status: UserStatus.SUSPENDED };
      service.adminUpdateUser.mockResolvedValue({
        ...mockUserResponse,
        status: UserStatus.SUSPENDED,
      });

      const mockAdmin: JwtPayload = { sub: 'admin-1', email: 'admin@test.com', role: UserRole.SUPER_ADMIN };
      const result = await controller.adminUpdateUser(mockAdmin, 'user-1', dto);

      expect(service.adminUpdateUser).toHaveBeenCalledWith('user-1', dto, UserRole.SUPER_ADMIN);
      expect(result.status).toBe(UserStatus.SUSPENDED);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should call usersService.deleteUser with the user ID', async () => {
      service.deleteUser.mockResolvedValue({
        message: 'User "user-1" has been deactivated',
      });

      const result = await controller.deleteUser('user-1');

      expect(service.deleteUser).toHaveBeenCalledWith('user-1');
      expect(result.message).toContain('user-1');
    });
  });
});
