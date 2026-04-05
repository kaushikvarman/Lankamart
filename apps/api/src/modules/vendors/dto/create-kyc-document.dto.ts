import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

const KYC_DOCUMENT_TYPES = [
  'business_registration',
  'id_proof',
  'address_proof',
  'gst_certificate',
  'vat_certificate',
] as const;

export type KycDocumentType = (typeof KYC_DOCUMENT_TYPES)[number];

export class CreateKycDocumentDto {
  @ApiProperty({
    description: 'Type of KYC document',
    enum: KYC_DOCUMENT_TYPES,
    example: 'business_registration',
  })
  @IsString()
  @IsNotEmpty({ message: 'Document type is required' })
  @IsIn(KYC_DOCUMENT_TYPES, {
    message: `Document type must be one of: ${KYC_DOCUMENT_TYPES.join(', ')}`,
  })
  type!: KycDocumentType;

  @ApiProperty({
    description: 'Original file name',
    example: 'business-registration.pdf',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'File name is required' })
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({
    description: 'URL where the uploaded file is stored',
    example: 'https://storage.example.com/kyc/abc123/business-registration.pdf',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty({ message: 'File URL is required' })
  @IsUrl({}, { message: 'File URL must be a valid URL' })
  @MaxLength(500)
  fileUrl!: string;
}
