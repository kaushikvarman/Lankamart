import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '@/common/prisma/prisma.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const mockUser = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  passwordHash: 'hashed-password',
  firstName: 'Test',
  lastName: 'User',
  role: UserRole.BUYER,
  status: UserStatus.ACTIVE,
  emailVerified: false,
  phone: null,
  phoneVerified: false,
  avatarUrl: null,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockRefreshToken = {
  id: 'token-uuid-1',
  token: 'hashed-refresh-token',
  userId: 'user-uuid-1',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  revokedAt: null,
  createdAt: new Date(),
};

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      'jwt.accessSecret': 'test-access-secret',
      'jwt.accessExpiry': '15m',
      'jwt.refreshSecret': 'test-refresh-secret',
      'jwt.refreshExpiry': '7d',
    };
    return config[key];
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();

    mockJwtService.signAsync.mockResolvedValueOnce('access-token-value');
    mockJwtService.signAsync.mockResolvedValueOnce('refresh-token-value');
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'new@example.com',
      password: 'SecureP@ss1',
      firstName: 'New',
      lastName: 'User',
      role: UserRole.BUYER,
    };

    it('should register a new user and return tokens', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        status: UserStatus.PENDING_VERIFICATION,
      });
      mockPrismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);

      const result = await service.register(registerDto);

      expect(result.accessToken).toBe('access-token-value');
      expect(result.refreshToken).toBe('refresh-token-value');
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.firstName).toBe(registerDto.firstName);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: registerDto.email,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          role: UserRole.BUYER,
          status: UserStatus.PENDING_VERIFICATION,
        }),
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'SecureP@ss1',
    };

    it('should login with valid credentials and return tokens', async () => {
      const hashedPassword = await argon2.hash(loginDto.password);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: hashedPassword,
      });
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('access-token-value');
      expect(result.refreshToken).toBe('refresh-token-value');
      expect(result.user.email).toBe(mockUser.email);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException for non-existent email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: await argon2.hash('DifferentP@ss1'),
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException for suspended user', async () => {
      const hashedPassword = await argon2.hash(loginDto.password);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: hashedPassword,
        status: UserStatus.SUSPENDED,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Your account has been suspended or deactivated',
      );
    });

    it('should throw UnauthorizedException for deactivated user', async () => {
      const hashedPassword = await argon2.hash(loginDto.password);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: hashedPassword,
        status: UserStatus.DEACTIVATED,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshTokens', () => {
    const userId = 'user-uuid-1';
    const refreshToken = 'refresh-token-value';

    it('should rotate tokens successfully', async () => {
      const hashedToken = await argon2.hash(refreshToken);
      mockPrismaService.refreshToken.findFirst.mockResolvedValue({
        ...mockRefreshToken,
        token: hashedToken,
      });
      mockPrismaService.refreshToken.update.mockResolvedValue({
        ...mockRefreshToken,
        revokedAt: new Date(),
      });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);

      const result = await service.refreshTokens(userId, refreshToken);

      expect(result.accessToken).toBe('access-token-value');
      expect(result.refreshToken).toBe('refresh-token-value');
      expect(result.user.id).toBe(userId);
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: mockRefreshToken.id },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockPrismaService.refreshToken.findFirst.mockResolvedValue({
        ...mockRefreshToken,
        token: await argon2.hash('different-token'),
      });

      await expect(
        service.refreshTokens(userId, refreshToken),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when no token found', async () => {
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(null);

      await expect(
        service.refreshTokens(userId, refreshToken),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const hashedToken = await argon2.hash(refreshToken);
      mockPrismaService.refreshToken.findFirst.mockResolvedValue({
        ...mockRefreshToken,
        token: hashedToken,
        expiresAt: new Date(Date.now() - 1000),
      });
      mockPrismaService.refreshToken.update.mockResolvedValue({
        ...mockRefreshToken,
        revokedAt: new Date(),
      });

      await expect(
        service.refreshTokens(userId, refreshToken),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refreshTokens(userId, refreshToken),
      ).rejects.toThrow('Refresh token has expired');
    });
  });

  describe('logout', () => {
    it('should revoke all refresh tokens for user', async () => {
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.logout('user-uuid-1');

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-uuid-1',
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
