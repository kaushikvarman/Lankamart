import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDecimal,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CalculateShippingDto {
  @ApiProperty({
    description: 'Origin country (ISO 3166-1 alpha-2)',
    example: 'LK',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2}$/, { message: 'Origin country must be a 2-character ISO code' })
  originCountry!: string;

  @ApiProperty({
    description: 'Destination country (ISO 3166-1 alpha-2)',
    example: 'US',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2}$/, { message: 'Destination country must be a 2-character ISO code' })
  destinationCountry!: string;

  @ApiProperty({
    description: 'Package weight in kg',
    example: '5.500',
  })
  @IsNotEmpty()
  @IsDecimal({ decimal_digits: '0,3' }, { message: 'Weight must be a valid decimal in kg' })
  weight!: string;

  @ApiPropertyOptional({
    description: 'Package length in cm',
    example: '30.00',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' }, { message: 'Length must be a valid decimal in cm' })
  length?: string;

  @ApiPropertyOptional({
    description: 'Package width in cm',
    example: '20.00',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' }, { message: 'Width must be a valid decimal in cm' })
  width?: string;

  @ApiPropertyOptional({
    description: 'Package height in cm',
    example: '15.00',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' }, { message: 'Height must be a valid decimal in cm' })
  height?: string;

  @ApiPropertyOptional({
    description: 'Declared value of the shipment for insurance purposes',
    example: '500.00',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' }, { message: 'Declared value must be a valid decimal' })
  declaredValue?: string;

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
}
