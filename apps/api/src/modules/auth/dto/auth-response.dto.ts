import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus, User } from '@prisma/client';

class AuthUserDto {
  @ApiProperty({ description: 'User ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ description: 'Email address', example: 'buyer@example.com' })
  email!: string;

  @ApiProperty({ description: 'First name', example: 'Kamal' })
  firstName!: string;

  @ApiProperty({ description: 'Last name', example: 'Perera' })
  lastName!: string;

  @ApiProperty({ description: 'User role', enum: UserRole, example: UserRole.BUYER })
  role!: UserRole;

  @ApiProperty({ description: 'User status', enum: UserStatus, example: UserStatus.PENDING_VERIFICATION })
  status!: UserStatus;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken!: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken!: string;

  @ApiProperty({ description: 'Access token expiry in seconds', example: 900 })
  expiresIn!: number;

  @ApiProperty({ description: 'Authenticated user details', type: AuthUserDto })
  user!: AuthUserDto;

  static fromUser(
    user: User,
    tokens: { accessToken: string; refreshToken: string; expiresIn: number },
  ): AuthResponseDto {
    const dto = new AuthResponseDto();
    dto.accessToken = tokens.accessToken;
    dto.refreshToken = tokens.refreshToken;
    dto.expiresIn = tokens.expiresIn;
    dto.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
    };
    return dto;
  }
}
