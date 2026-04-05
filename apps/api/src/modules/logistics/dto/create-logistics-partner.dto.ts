import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingMode } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateLogisticsPartnerDto {
  @ApiProperty({
    description: 'Company name',
    example: 'Ceylon Freight Express',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Company name is required' })
  @MaxLength(255)
  companyName!: string;

  @ApiPropertyOptional({
    description: 'Company description',
    example: 'Leading freight and logistics provider in South Asia',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Contact email',
    example: 'info@ceylonfreight.lk',
    maxLength: 255,
  })
  @IsEmail({}, { message: 'Contact email must be a valid email address' })
  @IsNotEmpty({ message: 'Contact email is required' })
  @MaxLength(255)
  contactEmail!: string;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+94112345678',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty({ message: 'Contact phone is required' })
  @MaxLength(20)
  contactPhone!: string;

  @ApiPropertyOptional({
    description: 'Company website URL',
    example: 'https://ceylonfreight.lk',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;

  @ApiProperty({
    description: 'Coverage areas as JSON string of countries/regions',
    example: '{"countries":["LK","IN","SG"],"regions":["South Asia","Southeast Asia"]}',
  })
  @IsString()
  @IsNotEmpty({ message: 'Coverage areas is required' })
  coverageAreas!: string;

  @ApiProperty({
    description: 'Supported shipping modes',
    enum: ShippingMode,
    isArray: true,
    example: [ShippingMode.SEA_FREIGHT_FCL, ShippingMode.AIR_FREIGHT],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one shipping mode is required' })
  @IsEnum(ShippingMode, { each: true, message: 'Each shipping mode must be a valid ShippingMode' })
  shippingModes!: ShippingMode[];

  @ApiPropertyOptional({
    description: 'Certifications (JSON string)',
    example: '["ISO 9001","IATA Certified"]',
  })
  @IsOptional()
  @IsString()
  certifications?: string;

  @ApiProperty({
    description: 'Whether insurance is offered',
    example: true,
  })
  @IsBoolean()
  insuranceOffered!: boolean;

  @ApiProperty({
    description: 'Whether shipment tracking is enabled',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  trackingEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Tracking URL template with {tracking_number} placeholder',
    example: 'https://ceylonfreight.lk/track/{tracking_number}',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  trackingUrl?: string;
}
