import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditLog } from '@prisma/client';

export class AuditLogResponseDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional() userId!: string | null;
  @ApiProperty() action!: string;
  @ApiProperty() entityType!: string;
  @ApiProperty() entityId!: string;
  @ApiPropertyOptional() oldValue!: string | null;
  @ApiPropertyOptional() newValue!: string | null;
  @ApiPropertyOptional() ipAddress!: string | null;
  @ApiPropertyOptional() userAgent!: string | null;
  @ApiProperty() createdAt!: Date;

  static fromEntity(log: AuditLog): AuditLogResponseDto {
    const dto = new AuditLogResponseDto();
    dto.id = log.id;
    dto.userId = log.userId;
    dto.action = log.action;
    dto.entityType = log.entityType;
    dto.entityId = log.entityId;
    dto.oldValue = log.oldValue;
    dto.newValue = log.newValue;
    dto.ipAddress = log.ipAddress;
    dto.userAgent = log.userAgent;
    dto.createdAt = log.createdAt;
    return dto;
  }
}
