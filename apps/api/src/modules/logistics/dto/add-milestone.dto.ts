import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddMilestoneDto {
  @ApiProperty({
    description: 'Milestone status',
    example: 'in_transit',
  })
  @IsString()
  @IsNotEmpty({ message: 'Status is required' })
  @MaxLength(50)
  status!: string;

  @ApiPropertyOptional({
    description: 'Location where the event occurred',
    example: 'Colombo Port',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({
    description: 'Description of the milestone event',
    example: 'Package cleared customs and is in transit to destination',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'When the event occurred',
    example: '2026-04-05T10:30:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  occurredAt!: Date;
}
