import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsUrl, MinLength } from 'class-validator';

export class ConfirmBankTransferDto {
  @ApiProperty({
    description: 'Payment ID to confirm bank transfer for',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  paymentId!: string;

  @ApiProperty({
    description: 'Bank transfer reference number',
    example: 'TXN-2026-04-05-1234',
  })
  @IsString()
  @MinLength(3)
  bankReference!: string;

  @ApiProperty({
    description: 'URL to proof of bank transfer (receipt/screenshot)',
    example: 'https://cdn.lankamart.com/uploads/bank-proof/receipt-123.pdf',
  })
  @IsUrl()
  bankProofUrl!: string;
}
