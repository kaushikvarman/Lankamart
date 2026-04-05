import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KycStatus, User, VendorProfile, VendorTier } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

type VendorProfileWithUser = VendorProfile & {
  user: Pick<User, 'firstName' | 'lastName' | 'email'>;
};

export class VendorProfileResponseDto {
  @ApiProperty({ description: 'Vendor profile ID' })
  id!: string;

  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({ description: 'Business name', example: 'Ceylon Spices Co.' })
  businessName!: string;

  @ApiProperty({ description: 'Business URL slug', example: 'ceylon-spices-co-a3f1' })
  businessSlug!: string;

  @ApiPropertyOptional({ description: 'Business description' })
  description!: string | null;

  @ApiPropertyOptional({ description: 'Logo URL' })
  logoUrl!: string | null;

  @ApiPropertyOptional({ description: 'Banner URL' })
  bannerUrl!: string | null;

  @ApiPropertyOptional({ description: 'Business registration number' })
  businessRegNo!: string | null;

  @ApiPropertyOptional({ description: 'GST number (India)' })
  gstNumber!: string | null;

  @ApiPropertyOptional({ description: 'VAT number (Sri Lanka)' })
  vatNumber!: string | null;

  @ApiProperty({ description: 'Vendor tier', enum: VendorTier, example: VendorTier.FREE })
  tier!: VendorTier;

  @ApiProperty({ description: 'KYC status', enum: KycStatus, example: KycStatus.NOT_SUBMITTED })
  kycStatus!: KycStatus;

  @ApiProperty({ description: 'Whether the vendor is verified', example: false })
  isVerified!: boolean;

  @ApiProperty({ description: 'Commission rate (%)', example: 5.0 })
  commissionRate!: number;

  @ApiProperty({ description: 'Country code', example: 'LK' })
  country!: string;

  @ApiPropertyOptional({ description: 'City', example: 'Colombo' })
  city!: string | null;

  @ApiPropertyOptional({ description: 'Website URL' })
  website!: string | null;

  @ApiPropertyOptional({ description: 'Year established', example: 2018 })
  yearEstablished!: number | null;

  @ApiPropertyOptional({ description: 'Employee count range', example: '11-50' })
  employeeCount!: string | null;

  @ApiPropertyOptional({ description: 'Main products' })
  mainProducts!: string | null;

  @ApiPropertyOptional({ description: 'Certifications (JSON)' })
  certifications!: string | null;

  @ApiProperty({ description: 'Average rating (0-5)', example: 4.5 })
  averageRating!: number;

  @ApiProperty({ description: 'Total number of reviews', example: 128 })
  totalReviews!: number;

  @ApiProperty({ description: 'Total sales count', example: 500 })
  totalSales!: number;

  @ApiPropertyOptional({ description: 'Average response time in hours', example: 2.5 })
  responseTimeHrs!: number | null;

  @ApiProperty({ description: 'Owner first name', example: 'Kamal' })
  firstName!: string;

  @ApiProperty({ description: 'Owner last name', example: 'Perera' })
  lastName!: string;

  @ApiProperty({ description: 'Owner email', example: 'vendor@example.com' })
  email!: string;

  @ApiProperty({ description: 'Profile creation date' })
  createdAt!: Date;

  @ApiProperty({ description: 'Profile last updated date' })
  updatedAt!: Date;

  static fromEntity(vendor: VendorProfileWithUser): VendorProfileResponseDto {
    const dto = new VendorProfileResponseDto();
    dto.id = vendor.id;
    dto.userId = vendor.userId;
    dto.businessName = vendor.businessName;
    dto.businessSlug = vendor.businessSlug;
    dto.description = vendor.description;
    dto.logoUrl = vendor.logoUrl;
    dto.bannerUrl = vendor.bannerUrl;
    dto.businessRegNo = vendor.businessRegNo;
    dto.gstNumber = vendor.gstNumber;
    dto.vatNumber = vendor.vatNumber;
    dto.tier = vendor.tier;
    dto.kycStatus = vendor.kycStatus;
    dto.isVerified = vendor.isVerified;
    dto.commissionRate = vendor.commissionRate instanceof Decimal
      ? vendor.commissionRate.toNumber()
      : Number(vendor.commissionRate);
    dto.country = vendor.country;
    dto.city = vendor.city;
    dto.website = vendor.website;
    dto.yearEstablished = vendor.yearEstablished;
    dto.employeeCount = vendor.employeeCount;
    dto.mainProducts = vendor.mainProducts;
    dto.certifications = vendor.certifications;
    dto.averageRating = vendor.averageRating instanceof Decimal
      ? vendor.averageRating.toNumber()
      : Number(vendor.averageRating);
    dto.totalReviews = vendor.totalReviews;
    dto.totalSales = vendor.totalSales;
    dto.responseTimeHrs = vendor.responseTimeHrs instanceof Decimal
      ? vendor.responseTimeHrs.toNumber()
      : vendor.responseTimeHrs !== null && vendor.responseTimeHrs !== undefined
        ? Number(vendor.responseTimeHrs)
        : null;
    dto.firstName = vendor.user.firstName;
    dto.lastName = vendor.user.lastName;
    dto.email = vendor.user.email;
    dto.createdAt = vendor.createdAt;
    dto.updatedAt = vendor.updatedAt;
    return dto;
  }
}

export class PublicVendorProfileResponseDto {
  @ApiProperty({ description: 'Vendor profile ID' })
  id!: string;

  @ApiProperty({ description: 'Business name' })
  businessName!: string;

  @ApiProperty({ description: 'Business URL slug' })
  businessSlug!: string;

  @ApiPropertyOptional({ description: 'Business description' })
  description!: string | null;

  @ApiPropertyOptional({ description: 'Logo URL' })
  logoUrl!: string | null;

  @ApiPropertyOptional({ description: 'Banner URL' })
  bannerUrl!: string | null;

  @ApiProperty({ description: 'Country code' })
  country!: string;

  @ApiPropertyOptional({ description: 'City' })
  city!: string | null;

  @ApiPropertyOptional({ description: 'Website URL' })
  website!: string | null;

  @ApiPropertyOptional({ description: 'Year established' })
  yearEstablished!: number | null;

  @ApiPropertyOptional({ description: 'Employee count range' })
  employeeCount!: string | null;

  @ApiPropertyOptional({ description: 'Main products' })
  mainProducts!: string | null;

  @ApiProperty({ description: 'Whether the vendor is verified' })
  isVerified!: boolean;

  @ApiProperty({ description: 'Average rating (0-5)' })
  averageRating!: number;

  @ApiProperty({ description: 'Total number of reviews' })
  totalReviews!: number;

  @ApiProperty({ description: 'Total sales count' })
  totalSales!: number;

  @ApiProperty({ description: 'Owner first name' })
  firstName!: string;

  @ApiProperty({ description: 'Owner last name' })
  lastName!: string;

  @ApiProperty({ description: 'Profile creation date' })
  createdAt!: Date;

  static fromEntity(vendor: VendorProfileWithUser): PublicVendorProfileResponseDto {
    const dto = new PublicVendorProfileResponseDto();
    dto.id = vendor.id;
    dto.businessName = vendor.businessName;
    dto.businessSlug = vendor.businessSlug;
    dto.description = vendor.description;
    dto.logoUrl = vendor.logoUrl;
    dto.bannerUrl = vendor.bannerUrl;
    dto.country = vendor.country;
    dto.city = vendor.city;
    dto.website = vendor.website;
    dto.yearEstablished = vendor.yearEstablished;
    dto.employeeCount = vendor.employeeCount;
    dto.mainProducts = vendor.mainProducts;
    dto.isVerified = vendor.isVerified;
    dto.averageRating = vendor.averageRating instanceof Decimal
      ? vendor.averageRating.toNumber()
      : Number(vendor.averageRating);
    dto.totalReviews = vendor.totalReviews;
    dto.totalSales = vendor.totalSales;
    dto.firstName = vendor.user.firstName;
    dto.lastName = vendor.user.lastName;
    dto.createdAt = vendor.createdAt;
    return dto;
  }
}
