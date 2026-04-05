import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    description: 'UUID of the user to start a conversation with',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsNotEmpty()
  recipientId!: string;

  @ApiPropertyOptional({
    description: 'Optional product UUID for context (e.g., product inquiry)',
    example: 'f1e2d3c4-b5a6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiProperty({
    description: 'The first message to send in the conversation',
    example: 'Hi, I am interested in your product. Could you share more details?',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  initialMessage!: string;
}
