import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Dispute, DisputeStatus, Order, User } from '@prisma/client';

type DisputeWithRelations = Dispute & {
  order?: Pick<Order, 'id' | 'orderNumber'>;
  initiator?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
};

export class DisputeInitiatorDto {
  @ApiProperty() id!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty() email!: string;
}

export class DisputeResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() orderId!: string;
  @ApiPropertyOptional() orderNumber!: string | null;
  @ApiPropertyOptional({ type: DisputeInitiatorDto })
  initiator!: DisputeInitiatorDto | null;
  @ApiProperty() reason!: string;
  @ApiProperty() description!: string;
  @ApiPropertyOptional({ type: [String] }) evidence!: string[] | null;
  @ApiProperty({ enum: DisputeStatus }) status!: DisputeStatus;
  @ApiPropertyOptional() resolution!: string | null;
  @ApiPropertyOptional() resolvedBy!: string | null;
  @ApiPropertyOptional() resolvedAt!: Date | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  static fromEntity(dispute: DisputeWithRelations): DisputeResponseDto {
    const dto = new DisputeResponseDto();
    dto.id = dispute.id;
    dto.orderId = dispute.orderId;
    dto.orderNumber = dispute.order?.orderNumber ?? null;
    dto.initiator = dispute.initiator
      ? {
          id: dispute.initiator.id,
          firstName: dispute.initiator.firstName,
          lastName: dispute.initiator.lastName,
          email: dispute.initiator.email,
        }
      : null;
    dto.reason = dispute.reason;
    dto.description = dispute.description;
    dto.evidence = dispute.evidence
      ? (JSON.parse(dispute.evidence) as string[])
      : null;
    dto.status = dispute.status;
    dto.resolution = dispute.resolution;
    dto.resolvedBy = dispute.resolvedBy;
    dto.resolvedAt = dispute.resolvedAt;
    dto.createdAt = dispute.createdAt;
    dto.updatedAt = dispute.updatedAt;
    return dto;
  }
}
