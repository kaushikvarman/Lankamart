import { ApiProperty } from '@nestjs/swagger';
import { PlatformSetting } from '@prisma/client';

export class SettingResponseDto {
  @ApiProperty() key!: string;
  @ApiProperty() value!: string;
  @ApiProperty() type!: string;
  @ApiProperty() group!: string;
  @ApiProperty() label!: string;

  static fromEntity(setting: PlatformSetting): SettingResponseDto {
    const dto = new SettingResponseDto();
    dto.key = setting.key;
    dto.value = setting.value;
    dto.type = setting.type;
    dto.group = setting.group;
    dto.label = setting.label;
    return dto;
  }
}
