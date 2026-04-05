import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateRfqQuoteDto {
  @ApiProperty({ description: 'RFQ ID to quote on' })
  @IsUUID()
  @IsNotEmpty()
  rfqId!: string;

  @ApiProperty({ description: 'Unit price', example: 12.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;

  @ApiProperty({ description: 'Total price', example: 1250.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalPrice!: number;

  @ApiProperty({ description: 'Currency code', example: 'USD' })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({ description: 'Lead time in days', example: 14 })
  @IsInt()
  @Min(1)
  leadTimeDays!: number;

  @ApiProperty({ description: 'Quote valid until (ISO 8601)' })
  @IsDateString()
  validUntil!: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Attachment URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
