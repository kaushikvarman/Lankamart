import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, IsUUID, MinLength } from 'class-validator';

export class ProcessRefundDto {
  @ApiProperty({
    description: 'Payment ID to refund',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  paymentId!: string;

  @ApiProperty({
    description: 'Refund amount (supports partial refunds)',
    example: 49.99,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @ApiProperty({
    description: 'Reason for the refund',
    example: 'Product arrived damaged',
  })
  @IsString()
  @MinLength(5)
  reason!: string;
}
