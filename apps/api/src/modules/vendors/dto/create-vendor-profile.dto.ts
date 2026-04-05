import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVendorProfileDto {
  @ApiProperty({
    description: 'Business name',
    example: 'Ceylon Spices Co.',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Business name is required' })
  @MaxLength(255)
  businessName!: string;

  @ApiPropertyOptional({
    description: 'Business description',
    example: 'Premium spice exporter from Sri Lanka since 1998',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Business registration number (BR for SL, CIN for India)',
    example: 'PV00012345',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessRegNo?: string;

  @ApiPropertyOptional({
    description: 'GST number (for India vendors)',
    example: '29AABCU9603R1ZM',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  gstNumber?: string;

  @ApiPropertyOptional({
    description: 'VAT number (for Sri Lanka vendors)',
    example: '124456789-7000',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  vatNumber?: string;

  @ApiProperty({
    description: 'Country code (LK or IN)',
    example: 'LK',
    enum: ['LK', 'IN'],
  })
  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  @IsIn(['LK', 'IN'], { message: 'Country must be LK or IN' })
  country!: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Colombo',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'Website URL',
    example: 'https://ceylonspices.lk',
    maxLength: 500,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Website must be a valid URL' })
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional({
    description: 'Year business was established',
    example: 2018,
  })
  @IsOptional()
  @IsInt({ message: 'Year established must be an integer' })
  @Min(1900, { message: 'Year established must be 1900 or later' })
  yearEstablished?: number;

  @ApiPropertyOptional({
    description: 'Employee count range',
    example: '11-50',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeCount?: string;

  @ApiPropertyOptional({
    description: 'Main products or services (comma-separated or JSON)',
    example: 'Cinnamon, Black Pepper, Cardamom',
  })
  @IsOptional()
  @IsString()
  mainProducts?: string;
}
