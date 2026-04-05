import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingMode } from '@prisma/client';
import {
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateShipmentDto {
  @ApiProperty({ description: 'Order item ID to ship' })
  @IsUUID()
  @IsNotEmpty()
  orderItemId!: string;

  @ApiProperty({ description: 'Logistics partner ID' })
  @IsUUID()
  @IsNotEmpty()
  partnerId!: string;

  @ApiProperty({
    description: 'Shipping mode',
    enum: ShippingMode,
    example: ShippingMode.AIR_FREIGHT,
  })
  @IsEnum(ShippingMode)
  shippingMode!: ShippingMode;

  @ApiPropertyOptional({ description: 'Package weight in kg', example: '5.500' })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,3' }, { message: 'Weight must be a valid decimal' })
  weight?: string;

  @ApiPropertyOptional({
    description: 'Package dimensions as LxWxH in cm',
    example: '30x20x15',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  dimensions?: string;

  @ApiPropertyOptional({
    description: 'Declared value of the shipment',
    example: '500.00',
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' }, { message: 'Declared value must be a valid decimal' })
  declaredValue?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
