import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingZone } from '@prisma/client';

export class ShippingZoneResponseDto {
  @ApiProperty({ description: 'Zone ID' })
  id!: string;

  @ApiProperty({ description: 'Zone name', example: 'South Asia' })
  name!: string;

  @ApiProperty({ description: 'Country codes', example: ['LK', 'IN', 'BD'] })
  countries!: string[];

  @ApiPropertyOptional({ description: 'Specific regions (JSON)' })
  regions!: string | null;

  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last updated date' })
  updatedAt!: Date;

  static fromEntity(zone: ShippingZone): ShippingZoneResponseDto {
    const dto = new ShippingZoneResponseDto();
    dto.id = zone.id;
    dto.name = zone.name;
    dto.countries = JSON.parse(zone.countries) as string[];
    dto.regions = zone.regions;
    dto.createdAt = zone.createdAt;
    dto.updatedAt = zone.updatedAt;
    return dto;
  }
}
