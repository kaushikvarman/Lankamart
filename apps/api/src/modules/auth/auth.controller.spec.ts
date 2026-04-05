import { Test, TestingModule } from '@nestjs/testing';
import { UserRole, UserStatus } from '@prisma/client';
import { JwtPayload } from '@/common/decorators/current-user.decorator';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

const mockAuthResponse: AuthResponseDto = {
  accessToken: 'access-token-value',
  refreshToken: 'refresh-token-value',
  expiresIn: 900,
  user: {
    id: 'user-uuid-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.BUYER,
    status: UserStatus.ACTIVE,
  },
};

const mockAuthService = {
  register: jest.fn().mockResolvedValue(mockAuthResponse),
  login: jest.fn().mockResolvedValue(mockAuthResponse),
  refreshTokens: jest.fn().mockResolvedValue(mockAuthResponse),
  logout: jest.fn().mockResolvedValue({ message: 'Logged out successfully' }),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register with the correct DTO', async () => {
      const dto: RegisterDto = {
        email: 'new@example.com',
        password: 'SecureP@ss1',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.BUYER,
      };

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(authService.register).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('login', () => {
    it('should call authService.login with the correct DTO', async () => {
      const dto: LoginDto = {
        email: 'test@example.com',
        password: 'SecureP@ss1',
      };

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(authService.login).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshTokens with userId and refresh token', async () => {
      const user: JwtPayload = {
        sub: 'user-uuid-1',
        email: 'test@example.com',
        role: UserRole.BUYER,
      };
      const dto: RefreshTokenDto = {
        refreshToken: 'refresh-token-value',
      };

      const result = await controller.refresh(user, dto);

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        user.sub,
        dto.refreshToken,
      );
      expect(authService.refreshTokens).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with the user ID', async () => {
      const user: JwtPayload = {
        sub: 'user-uuid-1',
        email: 'test@example.com',
        role: UserRole.BUYER,
      };

      const result = await controller.logout(user);

      expect(authService.logout).toHaveBeenCalledWith(user.sub);
      expect(authService.logout).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });
});
