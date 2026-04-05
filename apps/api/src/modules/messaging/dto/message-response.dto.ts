import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

interface MessageEntity {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachments: string | null;
  isRead: boolean;
  createdAt: Date;
  sender?: {
    firstName: string;
    lastName: string;
  };
}

export class MessageResponseDto {
  @ApiProperty({ example: 'msg-uuid-1234' })
  id!: string;

  @ApiProperty({ example: 'conv-uuid-5678' })
  conversationId!: string;

  @ApiProperty({ example: 'user-uuid-0001' })
  senderId!: string;

  @ApiProperty({ example: 'John Doe' })
  senderName!: string;

  @ApiProperty({ example: 'Hello, I am interested in your product.' })
  content!: string;

  @ApiPropertyOptional({
    description: 'Array of attachment URLs',
    type: [String],
    example: ['https://cdn.example.com/file.pdf'],
  })
  attachments!: string[];

  @ApiProperty({ example: false })
  isRead!: boolean;

  @ApiProperty()
  createdAt!: Date;

  static fromEntity(entity: MessageEntity): MessageResponseDto {
    const dto = new MessageResponseDto();
    dto.id = entity.id;
    dto.conversationId = entity.conversationId;
    dto.senderId = entity.senderId;
    dto.senderName = entity.sender
      ? `${entity.sender.firstName} ${entity.sender.lastName}`
      : '';
    dto.content = entity.content;
    dto.isRead = entity.isRead;
    dto.createdAt = entity.createdAt;

    if (entity.attachments) {
      try {
        dto.attachments = JSON.parse(entity.attachments) as string[];
      } catch {
        dto.attachments = [];
      }
    } else {
      dto.attachments = [];
    }

    return dto;
  }
}
