import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  ConversationResponseDto,
  CreateConversationDto,
  MessageResponseDto,
  NotificationResponseDto,
  QueryConversationsDto,
  QueryNotificationsDto,
  SendMessageDto,
} from './dto';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ProductInfo {
  id: string;
  name: string;
  slug: string;
  images: Array<{ url: string; isPrimary: boolean }>;
}

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // CONVERSATIONS
  // ---------------------------------------------------------------------------

  async createConversation(
    userId: string,
    dto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    if (userId === dto.recipientId) {
      throw new BadRequestException('Cannot create a conversation with yourself');
    }

    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.recipientId, deletedAt: null },
    });

    if (!recipient) {
      throw new NotFoundException(
        `User with ID "${dto.recipientId}" not found`,
      );
    }

    // Check for existing conversation between these two users (with optional product context)
    const existingConversation = await this.findExistingConversation(
      userId,
      dto.recipientId,
      dto.productId,
    );

    if (existingConversation) {
      // Send the initial message to the existing conversation
      await this.createMessageRecord(
        existingConversation.id,
        userId,
        dto.recipientId,
        dto.initialMessage,
      );

      // Find sender's name from enriched participants
      const senderParticipant = existingConversation.participants.find(
        (p) => p.userId === userId,
      );
      const senderFirstName = senderParticipant?.user?.firstName ?? 'A user';

      // Create notification for the recipient
      await this.createNotification(
        dto.recipientId,
        NotificationType.MESSAGE,
        'New Message',
        `You have a new message from ${senderFirstName}`,
        `/messaging/conversations/${existingConversation.id}`,
      );

      return this.loadConversationResponse(existingConversation.id, userId);
    }

    // Validate product if provided
    if (dto.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId, deletedAt: null },
      });
      if (!product) {
        throw new NotFoundException(
          `Product with ID "${dto.productId}" not found`,
        );
      }
    }

    // Create new conversation with participants and initial message
    const conversation = await this.prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: {
          productId: dto.productId ?? null,
          participants: {
            createMany: {
              data: [
                { userId },
                { userId: dto.recipientId },
              ],
            },
          },
          messages: {
            create: {
              senderId: userId,
              receiverId: dto.recipientId,
              content: dto.initialMessage,
            },
          },
        },
      });

      return conv;
    });

    // Create notification for the recipient
    const sender = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true },
    });

    await this.createNotification(
      dto.recipientId,
      NotificationType.MESSAGE,
      'New Conversation',
      `${sender?.firstName ?? 'A user'} started a conversation with you`,
      `/messaging/conversations/${conversation.id}`,
    );

    this.logger.log(
      `Conversation created: ${conversation.id} between ${userId} and ${dto.recipientId}`,
    );

    return this.loadConversationResponse(conversation.id, userId);
  }

  async getConversations(
    userId: string,
    query: QueryConversationsDto,
  ): Promise<PaginatedResponse<ConversationResponseDto>> {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ConversationWhereInput = {
      participants: {
        some: { userId },
      },
    };

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          participants: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    // Collect participant user IDs and product IDs
    const participantUserIds = new Set<string>();
    const productIds = new Set<string>();

    for (const conv of conversations) {
      for (const p of conv.participants) {
        participantUserIds.add(p.userId);
      }
      if (conv.productId) {
        productIds.add(conv.productId);
      }
    }

    // Fetch user info and product info in parallel
    const [users, products, unreadCounts] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: Array.from(participantUserIds) } },
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      }),
      productIds.size > 0
        ? this.prisma.product.findMany({
            where: { id: { in: Array.from(productIds) } },
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                select: { url: true, isPrimary: true },
                orderBy: { sortOrder: 'asc' },
                take: 1,
              },
            },
          })
        : Promise.resolve([]),
      this.prisma.message.groupBy({
        by: ['conversationId'],
        where: {
          conversationId: { in: conversations.map((c) => c.id) },
          senderId: { not: userId },
          isRead: false,
        },
        _count: { id: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const productMap = new Map(products.map((p) => [p.id, p]));
    const unreadMap = new Map(
      unreadCounts.map((uc) => [uc.conversationId, uc._count.id]),
    );

    const totalPages = Math.ceil(total / limit);

    const data = conversations.map((conv) => {
      const enrichedParticipants = conv.participants.map((p) => ({
        ...p,
        user: userMap.get(p.userId) ?? {
          firstName: '',
          lastName: '',
          avatarUrl: null,
        },
      }));

      const product = conv.productId
        ? productMap.get(conv.productId) ?? null
        : null;

      return ConversationResponseDto.fromEntity({
        ...conv,
        participants: enrichedParticipants,
        product,
        _unreadCount: unreadMap.get(conv.id) ?? 0,
      });
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getConversation(
    conversationId: string,
    userId: string,
  ): Promise<{
    conversation: ConversationResponseDto;
    messages: MessageResponseDto[];
  }> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with ID "${conversationId}" not found`,
      );
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Mark messages as read
    await this.markAsRead(conversationId, userId);

    // Fetch recent messages and product in parallel
    const [messages, product] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }).then((msgs) => msgs.reverse()), // Re-order to chronological
      conversation.productId
        ? this.prisma.product.findUnique({
            where: { id: conversation.productId },
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                select: { url: true, isPrimary: true },
                orderBy: { sortOrder: 'asc' },
                take: 1,
              },
            },
          })
        : Promise.resolve(null),
    ]);

    // Fetch participant user info
    const participantUserIds = conversation.participants.map((p) => p.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: participantUserIds } },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedParticipants = conversation.participants.map((p) => ({
      ...p,
      user: userMap.get(p.userId) ?? {
        firstName: '',
        lastName: '',
        avatarUrl: null,
      },
    }));

    const lastMessage = messages[messages.length - 1];

    const conversationDto = ConversationResponseDto.fromEntity({
      ...conversation,
      participants: enrichedParticipants,
      messages: lastMessage ? [lastMessage] : [],
      product,
      _unreadCount: 0, // Just marked as read
    });

    const messageDtos = messages.map((m) => MessageResponseDto.fromEntity(m));

    return { conversation: conversationDto, messages: messageDtos };
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    dto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with ID "${conversationId}" not found`,
      );
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Determine the receiver (the other participant)
    const recipientParticipant = conversation.participants.find(
      (p) => p.userId !== userId,
    );

    if (!recipientParticipant) {
      throw new BadRequestException(
        'No recipient found in this conversation',
      );
    }

    const receiverId = recipientParticipant.userId;

    const message = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          receiverId,
          content: dto.content,
          attachments: dto.attachments
            ? JSON.stringify(dto.attachments)
            : null,
        },
        include: {
          sender: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      // Update conversation updatedAt
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return msg;
    });

    // Create notification for recipient
    const senderName = `${message.sender.firstName} ${message.sender.lastName}`;
    const truncatedContent =
      dto.content.length > 100
        ? dto.content.substring(0, 100) + '...'
        : dto.content;

    await this.createNotification(
      receiverId,
      NotificationType.MESSAGE,
      'New Message',
      `${senderName}: ${truncatedContent}`,
      `/messaging/conversations/${conversationId}`,
    );

    this.logger.log(
      `Message sent in conversation ${conversationId} by user ${userId}`,
    );

    return MessageResponseDto.fromEntity(message);
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with ID "${conversationId}" not found`,
      );
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    const now = new Date();

    await this.prisma.$transaction([
      // Mark all unread messages from the other user as read
      this.prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false,
        },
        data: { isRead: true },
      }),
      // Update participant lastReadAt
      this.prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
        data: { lastReadAt: now },
      }),
    ]);
  }

  async getUnreadCount(userId: string): Promise<number> {
    // Get all conversation IDs where user is a participant
    const participantRecords =
      await this.prisma.conversationParticipant.findMany({
        where: { userId },
        select: { conversationId: true },
      });

    const conversationIds = participantRecords.map((p) => p.conversationId);

    if (conversationIds.length === 0) {
      return 0;
    }

    return this.prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        isRead: false,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // NOTIFICATIONS
  // ---------------------------------------------------------------------------

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    content: string,
    link?: string,
    metadata?: Record<string, unknown>,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
        link: link ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    this.logger.log(
      `Notification created: ${type} for user ${userId} — "${title}"`,
    );

    return NotificationResponseDto.fromEntity(notification);
  }

  async getNotifications(
    userId: string,
    query: QueryNotificationsDto,
  ): Promise<PaginatedResponse<NotificationResponseDto>> {
    const { page, limit, type, isRead } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(type !== undefined && { type }),
      ...(isRead !== undefined && { isRead }),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: notifications.map((n) => NotificationResponseDto.fromEntity(n)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async markNotificationRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notification with ID "${notificationId}" not found`,
      );
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'This notification does not belong to you',
      );
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return NotificationResponseDto.fromEntity(updated);
  }

  async markAllNotificationsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    this.logger.log(
      `Marked ${result.count} notifications as read for user ${userId}`,
    );

    return { count: result.count };
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  private async findExistingConversation(
    userId: string,
    recipientId: string,
    productId?: string,
  ): Promise<{
    id: string;
    productId: string | null;
    createdAt: Date;
    updatedAt: Date;
    participants: Array<{
      conversationId: string;
      userId: string;
      lastReadAt: Date | null;
      user?: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
    }>;
  } | null> {
    const whereClause: Prisma.ConversationWhereInput = {
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: recipientId } } },
      ],
    };

    if (productId !== undefined) {
      whereClause.productId = productId;
    }

    const conversations = await this.prisma.conversation.findMany({
      where: whereClause,
      include: {
        participants: true,
      },
    });

    if (conversations.length === 0) {
      return null;
    }

    // Find conversations with exactly these two participants
    const exactMatch = conversations.find((c) => c.participants.length === 2);

    if (!exactMatch) {
      return null;
    }

    // Fetch user info for participants
    const participantUserIds = exactMatch.participants.map((p) => p.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: participantUserIds } },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      ...exactMatch,
      participants: exactMatch.participants.map((p) => ({
        ...p,
        user: userMap.get(p.userId),
      })),
    };
  }

  private async createMessageRecord(
    conversationId: string,
    senderId: string,
    receiverId: string,
    content: string,
    attachments?: string[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.message.create({
        data: {
          conversationId,
          senderId,
          receiverId,
          content,
          attachments: attachments ? JSON.stringify(attachments) : null,
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    });
  }

  private async loadConversationResponse(
    conversationId: string,
    userId: string,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Fetch participant user info and product info in parallel
    const participantUserIds = conversation.participants.map((p) => p.userId);

    const [users, product] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: participantUserIds } },
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      }),
      conversation.productId
        ? this.prisma.product.findUnique({
            where: { id: conversation.productId },
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                select: { url: true, isPrimary: true },
                orderBy: { sortOrder: 'asc' },
                take: 1,
              },
            },
          })
        : Promise.resolve(null),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedParticipants = conversation.participants.map((p) => ({
      ...p,
      user: userMap.get(p.userId) ?? {
        firstName: '',
        lastName: '',
        avatarUrl: null,
      },
    }));

    const unreadCount = await this.prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
    });

    return ConversationResponseDto.fromEntity({
      ...conversation,
      participants: enrichedParticipants,
      product,
      _unreadCount: unreadCount,
    });
  }
}
