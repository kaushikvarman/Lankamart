import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class AdminVerifyBankTransferDto {
  @ApiProperty({
    description: 'Payment ID to verify',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  paymentId!: string;

  @ApiProperty({
    description: 'Action: approve or reject the bank transfer',
    enum: ['approve', 'reject'],
    example: 'approve',
  })
  @IsIn(['approve', 'reject'])
  action!: 'approve' | 'reject';

  @ApiPropertyOptional({
    description: 'Optional note (required for rejection)',
    example: 'Transfer reference does not match records',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
