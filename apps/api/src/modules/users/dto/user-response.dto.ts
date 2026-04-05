import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus, User, VendorProfile } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class VendorPublicDto {
  @ApiProperty({ description: 'Vendor profile ID' })
  id!: string;

  @ApiProperty({ description: 'Business name', example: 'Ceylon Spices Co.' })
  businessName!: string;

  @ApiProperty({ description: 'Business URL slug', example: 'ceylon-spices-co' })
  businessSlug!: string;

  @ApiPropertyOptional({ description: 'Business description' })
  description!: string | null;

  @ApiPropertyOptional({ description: 'Logo URL' })
  logoUrl!: string | null;

  @ApiPropertyOptional({ description: 'Banner URL' })
  bannerUrl!: string | null;

  @ApiProperty({ description: 'Whether the vendor is verified', example: true })
  isVerified!: boolean;

  @ApiProperty({ description: 'Average rating (0-5)', example: 4.5 })
  averageRating!: number;

  @ApiProperty({ description: 'Total number of reviews', example: 128 })
  totalReviews!: number;

  @ApiProperty({ description: 'Country code (ISO 3166-1 alpha-2)', example: 'LK' })
  country!: string;

  @ApiPropertyOptional({ description: 'City', example: 'Colombo' })
  city!: string | null;

  @ApiPropertyOptional({ description: 'Website URL' })
  website!: string | null;

  @ApiPropertyOptional({ description: 'Year established', example: 2018 })
  yearEstablished!: number | null;

  @ApiProperty({ description: 'Profile creation date' })
  createdAt!: Date;

  static fromEntity(vendor: VendorProfile): VendorPublicDto {
    const dto = new VendorPublicDto();
    dto.id = vendor.id;
    dto.businessName = vendor.businessName;
    dto.businessSlug = vendor.businessSlug;
    dto.description = vendor.description;
    dto.logoUrl = vendor.logoUrl;
    dto.bannerUrl = vendor.bannerUrl;
    dto.isVerified = vendor.isVerified;
    dto.averageRating = vendor.averageRating instanceof Decimal
      ? vendor.averageRating.toNumber()
      : Number(vendor.averageRating);
    dto.totalReviews = vendor.totalReviews;
    dto.country = vendor.country;
    dto.city = vendor.city;
    dto.website = vendor.website;
    dto.yearEstablished = vendor.yearEstablished;
    dto.createdAt = vendor.createdAt;
    return dto;
  }
}

export class UserResponseDto {
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

  @ApiProperty({ description: 'Account status', enum: UserStatus, example: UserStatus.ACTIVE })
  status!: UserStatus;

  @ApiPropertyOptional({ description: 'Phone number', example: '+94771234567' })
  phone!: string | null;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  avatarUrl!: string | null;

  @ApiProperty({ description: 'Whether email is verified', example: true })
  emailVerified!: boolean;

  @ApiProperty({ description: 'Whether phone is verified', example: false })
  phoneVerified!: boolean;

  @ApiProperty({ description: 'Account creation date' })
  createdAt!: Date;

  @ApiPropertyOptional({ description: 'Vendor profile (if user is a vendor)', type: VendorPublicDto })
  vendorProfile?: VendorPublicDto;

  static fromEntity(
    user: User & { vendorProfile?: VendorProfile | null },
  ): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.role = user.role;
    dto.status = user.status;
    dto.phone = user.phone;
    dto.avatarUrl = user.avatarUrl;
    dto.emailVerified = user.emailVerified;
    dto.phoneVerified = user.phoneVerified;
    dto.createdAt = user.createdAt;

    if (user.vendorProfile) {
      dto.vendorProfile = VendorPublicDto.fromEntity(user.vendorProfile);
    }

    return dto;
  }
}
