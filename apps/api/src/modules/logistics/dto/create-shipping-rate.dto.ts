import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingMode } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsDecimal,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateShippingRateDto {
  @ApiProperty({ description: 'Logistics partner ID' })
  @IsUUID()
  @IsNotEmpty()
  partnerId!: string;

  @ApiProperty({ description: 'Origin shipping zone ID' })
  @IsUUID()
  @IsNotEmpty()
  originZoneId!: string;

  @ApiProperty({ description: 'Destination shipping zone ID' })
  @IsUUID()
  @IsNotEmpty()
  destinationZoneId!: string;

  @ApiProperty({
    description: 'Shipping mode',
    enum: ShippingMode,
    example: ShippingMode.AIR_FREIGHT,
  })
  @IsEnum(ShippingMode)
  shippingMode!: ShippingMode;

  @ApiPropertyOptional({
    description: 'Currency (ISO 4217)',
    example: 'USD',
    default: 'USD',
    maxLength: 3,
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({ description: 'Base rate', example: '50.00' })
  @IsNotEmpty()
  @IsDecimal({ decimal_digits: '0,2' }, { message: 'Base rate must be a valid decimal' })
  baseRate!: string;

  @ApiProperty({ description: 'Per kilogram rate', example: '2.50' })
  @IsNotEmpty()
  @IsDecimal({ decimal_digits: '0,2' }, { message: 'Per kg rate must be a valid decimal' })
  perKgRate!: string;

  @ApiPropertyOptional({
    description: 'Per cubic meter rate (for sea freight)',
    example: '150.00',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' }, { message: 'Per CBM rate must be a valid decimal' })
  perCbmRate?: string;

  @ApiPropertyOptional({
    description: 'Minimum chargeable weight in kg',
    example: '0.000',
    default: '0',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,3' }, { message: 'Min weight must be a valid decimal' })
  minWeight?: string;

  @ApiPropertyOptional({
    description: 'Maximum weight per shipment in kg',
    example: '1000.000',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,3' }, { message: 'Max weight must be a valid decimal' })
  maxWeight?: string;

  @ApiProperty({ description: 'Minimum transit time in days', example: 5 })
  @IsInt()
  @Min(1, { message: 'Minimum transit days must be at least 1' })
  minTransitDays!: number;

  @ApiProperty({ description: 'Maximum transit time in days', example: 14 })
  @IsInt()
  @Min(1, { message: 'Maximum transit days must be at least 1' })
  maxTransitDays!: number;

  @ApiPropertyOptional({
    description: 'Fuel surcharge percentage',
    example: '5.00',
    default: '0',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' }, { message: 'Fuel surcharge must be a valid decimal' })
  fuelSurcharge?: string;

  @ApiPropertyOptional({
    description: 'Insurance rate as percentage of declared value',
    example: '1.50',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' }, { message: 'Insurance rate must be a valid decimal' })
  insuranceRate?: string;

  @ApiPropertyOptional({ description: 'Rate valid from date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date;

  @ApiPropertyOptional({ description: 'Rate valid until date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validUntil?: Date;
}
