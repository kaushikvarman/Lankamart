import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';

export class AdminUpdateUserDto {
  @ApiPropertyOptional({
    description: 'Account status',
    enum: [UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.DEACTIVATED],
    example: UserStatus.SUSPENDED,
  })
  @IsOptional()
  @IsEnum([UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.DEACTIVATED], {
    message: 'status must be one of: ACTIVE, SUSPENDED, DEACTIVATED',
  })
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    example: UserRole.VENDOR,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'role must be a valid UserRole' })
  role?: UserRole;
}
