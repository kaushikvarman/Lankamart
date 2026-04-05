import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateShippingZoneDto {
  @ApiProperty({
    description: 'Zone name',
    example: 'South Asia',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty({ message: 'Zone name is required' })
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Array of ISO 3166-1 alpha-2 country codes',
    example: ['LK', 'IN', 'BD', 'PK', 'NP'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one country code is required' })
  @IsString({ each: true })
  @Matches(/^[A-Z]{2}$/, { each: true, message: 'Each country must be a 2-character ISO code' })
  countries!: string[];

  @ApiPropertyOptional({
    description: 'Specific regions within countries (JSON string)',
    example: '{"LK":["Western Province","Southern Province"],"IN":["Tamil Nadu","Kerala"]}',
  })
  @IsOptional()
  @IsString()
  regions?: string;
}
