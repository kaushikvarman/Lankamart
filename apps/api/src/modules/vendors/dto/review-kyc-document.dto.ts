import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { KycStatus } from '@prisma/client';

const REVIEW_STATUSES = [KycStatus.APPROVED, KycStatus.REJECTED] as const;

export class ReviewKycDocumentDto {
  @ApiProperty({
    description: 'Review decision',
    enum: REVIEW_STATUSES,
    example: KycStatus.APPROVED,
  })
  @IsString()
  @IsNotEmpty({ message: 'Status is required' })
  @IsIn(REVIEW_STATUSES, { message: 'Status must be APPROVED or REJECTED' })
  status!: typeof KycStatus.APPROVED | typeof KycStatus.REJECTED;

  @ApiPropertyOptional({
    description: 'Review note or reason for rejection',
    example: 'Document verified successfully',
  })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}
