import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  UserResponseDto,
  VendorPublicDto,
  UpdateUserDto,
  AdminUpdateUserDto,
  QueryUsersDto,
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

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: { vendorProfile: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return UserResponseDto.fromEntity(user);
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { vendorProfile: true },
    });

    if (!user || user.deletedAt !== null) {
      return null;
    }

    return UserResponseDto.fromEntity(user);
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: { vendorProfile: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return UserResponseDto.fromEntity(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      include: { vendorProfile: true },
    });

    this.logger.log(`User profile updated: ${userId}`);
    return UserResponseDto.fromEntity(updatedUser);
  }

  async getPublicVendorProfile(slug: string): Promise<VendorPublicDto> {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { businessSlug: slug },
      include: {
        user: {
          select: { deletedAt: true, status: true },
        },
      },
    });

    if (
      !vendorProfile ||
      vendorProfile.user.deletedAt !== null ||
      vendorProfile.user.status !== 'ACTIVE'
    ) {
      throw new NotFoundException(
        `Vendor with slug "${slug}" not found`,
      );
    }

    return VendorPublicDto.fromEntity(vendorProfile);
  }

  async listUsers(
    query: QueryUsersDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    const { page, limit, role, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role && { role }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { vendorProfile: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: users.map((user) => UserResponseDto.fromEntity(user)),
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

  async adminUpdateUser(
    userId: string,
    dto: AdminUpdateUserDto,
    currentUserRole: UserRole,
  ): Promise<UserResponseDto> {
    if (dto.role === UserRole.SUPER_ADMIN && currentUserRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can assign the SUPER_ADMIN role');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.role !== undefined && { role: dto.role }),
      },
      include: { vendorProfile: true },
    });

    this.logger.log(
      `Admin updated user ${userId}: ${JSON.stringify(dto)}`,
    );
    return UserResponseDto.fromEntity(updatedUser);
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    this.logger.warn(`User soft-deleted: ${userId}`);
    return { message: `User "${userId}" has been deactivated` };
  }
}
