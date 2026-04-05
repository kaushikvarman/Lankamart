import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const SUPPORTED_CURRENCIES = ['LKR', 'INR', 'USD'] as const;

export class CreatePayoutAccountDto {
  @ApiProperty({
    description: 'Bank name',
    example: 'Bank of Ceylon',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty({ message: 'Bank name is required' })
  @MaxLength(200)
  bankName!: string;

  @ApiProperty({
    description: 'Account holder name',
    example: 'Ceylon Spices Co. (Pvt) Ltd',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty({ message: 'Account name is required' })
  @MaxLength(200)
  accountName!: string;

  @ApiProperty({
    description: 'Bank account number',
    example: '0012345678',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'Account number is required' })
  @MaxLength(50)
  accountNumber!: string;

  @ApiPropertyOptional({
    description: 'Routing code (IFSC for India, branch code for Sri Lanka)',
    example: 'SBIN0001234',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  routingCode?: string;

  @ApiPropertyOptional({
    description: 'SWIFT/BIC code for international transfers',
    example: 'BABORSLX',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  swiftCode?: string;

  @ApiProperty({
    description: 'Currency for payouts',
    enum: SUPPORTED_CURRENCIES,
    example: 'LKR',
  })
  @IsString()
  @IsNotEmpty({ message: 'Currency is required' })
  @IsIn(SUPPORTED_CURRENCIES, {
    message: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`,
  })
  currency!: string;

  @ApiPropertyOptional({
    description: 'Whether this is the default payout account',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
