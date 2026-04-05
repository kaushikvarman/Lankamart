import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MinLength,
} from 'class-validator';

export enum DisputeReason {
  NOT_RECEIVED = 'not_received',
  NOT_AS_DESCRIBED = 'not_as_described',
  DAMAGED = 'damaged',
  WRONG_ITEM = 'wrong_item',
}

export class CreateDisputeDto {
  @ApiProperty({ description: 'Order ID' })
  @IsUUID()
  orderId!: string;

  @ApiProperty({ description: 'Dispute reason', enum: DisputeReason })
  @IsEnum(DisputeReason)
  reason!: DisputeReason;

  @ApiProperty({ description: 'Detailed description (min 20 chars)' })
  @IsString()
  @MinLength(20)
  description!: string;

  @ApiPropertyOptional({ description: 'Evidence URLs', type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  evidence?: string[];
}
