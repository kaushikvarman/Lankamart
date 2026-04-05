import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ModerateReviewDto {
  @ApiProperty({ description: 'Set review visibility' })
  @IsBoolean()
  visible!: boolean;
}
