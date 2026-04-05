import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

const SELF_REGISTRATION_ROLES = [UserRole.BUYER, UserRole.VENDOR] as const;
type SelfRegistrationRole = (typeof SELF_REGISTRATION_ROLES)[number];

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'buyer@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    description:
      'Password (min 8 chars, at least 1 uppercase, 1 number, 1 special character)',
    example: 'SecureP@ss1',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/(?=.*\d)/, {
    message: 'Password must contain at least one number',
  })
  @Matches(/(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, {
    message: 'Password must contain at least one special character',
  })
  password!: string;

  @ApiProperty({
    description: 'First name',
    example: 'Kamal',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Perera',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({
    description: 'User role (only BUYER or VENDOR allowed for self-registration)',
    enum: SELF_REGISTRATION_ROLES,
    example: UserRole.BUYER,
  })
  @IsEnum([UserRole.BUYER, UserRole.VENDOR], {
    message: 'Role must be either BUYER or VENDOR for self-registration',
  })
  @IsNotEmpty()
  role!: SelfRegistrationRole;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+94771234567',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
