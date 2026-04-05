import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

interface NotificationEntity {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  link: string | null;
  isRead: boolean;
  metadata: string | null;
  createdAt: Date;
}

export class NotificationResponseDto {
  @ApiProperty({ example: 'notif-uuid-1234' })
  id!: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.ORDER_UPDATE })
  type!: NotificationType;

  @ApiProperty({ example: 'Order Shipped' })
  title!: string;

  @ApiProperty({ example: 'Your order LM-20260405-0001 has been shipped.' })
  content!: string;

  @ApiPropertyOptional({
    description: 'Deep link for the notification',
    example: '/orders/order-uuid-1234',
  })
  link?: string | null;

  @ApiProperty({ example: false })
  isRead!: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata as a JSON object',
    type: 'object',
  })
  metadata?: Record<string, unknown> | null;

  @ApiProperty()
  createdAt!: Date;

  static fromEntity(entity: NotificationEntity): NotificationResponseDto {
    const dto = new NotificationResponseDto();
    dto.id = entity.id;
    dto.type = entity.type;
    dto.title = entity.title;
    dto.content = entity.content;
    dto.link = entity.link;
    dto.isRead = entity.isRead;
    dto.createdAt = entity.createdAt;

    if (entity.metadata) {
      try {
        dto.metadata = JSON.parse(entity.metadata) as Record<string, unknown>;
      } catch {
        dto.metadata = null;
      }
    } else {
      dto.metadata = null;
    }

    return dto;
  }
}
