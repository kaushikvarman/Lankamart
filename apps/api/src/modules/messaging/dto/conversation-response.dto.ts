import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

interface ParticipantInfo {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

interface ProductContext {
  id: string;
  name: string;
  slug: string;
  primaryImage: string | null;
}

interface LastMessageInfo {
  content: string;
  senderId: string;
  createdAt: Date;
}

interface ConversationEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  productId?: string | null;
  participants: Array<{
    userId: string;
    user?: {
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
  }>;
  messages?: Array<{
    content: string;
    senderId: string;
    createdAt: Date;
  }>;
  product?: {
    id: string;
    name: string;
    slug: string;
    images?: Array<{
      url: string;
      isPrimary: boolean;
    }>;
  } | null;
  _unreadCount?: number;
}

export class ConversationResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({
    description: 'Conversation participants',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        avatarUrl: { type: 'string', nullable: true },
      },
    },
  })
  participants!: ParticipantInfo[];

  @ApiPropertyOptional({
    description: 'Product context if conversation is about a specific product',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      slug: { type: 'string' },
      primaryImage: { type: 'string', nullable: true },
    },
  })
  productContext?: ProductContext;

  @ApiProperty({
    description: 'The most recent message in the conversation',
    type: 'object',
    properties: {
      content: { type: 'string' },
      senderId: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  })
  lastMessage!: LastMessageInfo;

  @ApiProperty({ description: 'Number of unread messages for the current user', example: 3 })
  unreadCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(entity: ConversationEntity): ConversationResponseDto {
    const dto = new ConversationResponseDto();
    dto.id = entity.id;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;

    dto.participants = entity.participants.map((p) => ({
      userId: p.userId,
      firstName: p.user?.firstName ?? '',
      lastName: p.user?.lastName ?? '',
      avatarUrl: p.user?.avatarUrl ?? null,
    }));

    if (entity.product) {
      const primaryImage = entity.product.images?.find((img) => img.isPrimary);
      dto.productContext = {
        id: entity.product.id,
        name: entity.product.name,
        slug: entity.product.slug,
        primaryImage: primaryImage?.url ?? entity.product.images?.[0]?.url ?? null,
      };
    }

    const lastMsg = entity.messages?.[0];
    dto.lastMessage = lastMsg
      ? { content: lastMsg.content, senderId: lastMsg.senderId, createdAt: lastMsg.createdAt }
      : { content: '', senderId: '', createdAt: entity.createdAt };

    dto.unreadCount = entity._unreadCount ?? 0;

    return dto;
  }
}
