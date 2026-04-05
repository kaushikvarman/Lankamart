import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';

export enum DisputeResolutionStatus {
  RESOLVED_BUYER = 'RESOLVED_BUYER',
  RESOLVED_VENDOR = 'RESOLVED_VENDOR',
}

export class ResolveDisputeDto {
  @ApiProperty({ description: 'Resolution description' })
  @IsString()
  @MinLength(10)
  resolution!: string;

  @ApiProperty({
    description: 'Resolution status',
    enum: DisputeResolutionStatus,
  })
  @IsEnum(DisputeResolutionStatus)
  status!: DisputeResolutionStatus;
}
