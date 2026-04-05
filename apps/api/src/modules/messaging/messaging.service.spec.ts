import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { MessagingService } from './messaging.service';

const MOCK_USER_ID = 'user-001';
const MOCK_RECIPIENT_ID = 'user-002';
const MOCK_CONVERSATION_ID = 'conv-001';
const MOCK_MESSAGE_ID = 'msg-001';
const MOCK_PRODUCT_ID = 'product-001';
const MOCK_NOTIFICATION_ID = 'notif-001';

const mockUser = {
  id: MOCK_USER_ID,
  firstName: 'John',
  lastName: 'Doe',
  avatarUrl: null,
  email: 'john@example.com',
  deletedAt: null,
};

const mockRecipient = {
  id: MOCK_RECIPIENT_ID,
  firstName: 'Jane',
  lastName: 'Smith',
  avatarUrl: null,
  email: 'jane@example.com',
  deletedAt: null,
};

const mockConversation = {
  id: MOCK_CONVERSATION_ID,
  productId: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  participants: [
    { conversationId: MOCK_CONVERSATION_ID, userId: MOCK_USER_ID, lastReadAt: null },
    { conversationId: MOCK_CONVERSATION_ID, userId: MOCK_RECIPIENT_ID, lastReadAt: null },
  ],
  messages: [
    {
      id: MOCK_MESSAGE_ID,
      conversationId: MOCK_CONVERSATION_ID,
      senderId: MOCK_USER_ID,
      receiverId: MOCK_RECIPIENT_ID,
      content: 'Hello!',
      attachments: null,
      isRead: false,
      createdAt: new Date('2025-01-01'),
    },
  ],
  product: null,
};

const mockMessage = {
  id: MOCK_MESSAGE_ID,
  conversationId: MOCK_CONVERSATION_ID,
  senderId: MOCK_USER_ID,
  receiverId: MOCK_RECIPIENT_ID,
  content: 'Hello!',
  attachments: null,
  isRead: false,
  createdAt: new Date('2025-01-01'),
  sender: { firstName: 'John', lastName: 'Doe' },
};

const mockNotification = {
  id: MOCK_NOTIFICATION_ID,
  userId: MOCK_USER_ID,
  type: NotificationType.ORDER_UPDATE,
  title: 'Order Shipped',
  content: 'Your order has been shipped.',
  link: '/orders/order-001',
  isRead: false,
  metadata: null,
  createdAt: new Date('2025-01-01'),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  conversation: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  conversationParticipant: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  message: {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  notification: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('MessagingService', () => {
  let service: MessagingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // createConversation
  // ---------------------------------------------------------------------------

  describe('createConversation', () => {
    it('should throw BadRequestException when creating conversation with yourself', async () => {
      await expect(
        service.createConversation(MOCK_USER_ID, {
          recipientId: MOCK_USER_ID,
          initialMessage: 'Hello me!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when recipient does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.createConversation(MOCK_USER_ID, {
          recipientId: 'non-existent',
          initialMessage: 'Hello!',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create a new conversation when none exists', async () => {
      // Recipient exists
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockRecipient) // recipient lookup
        .mockResolvedValueOnce(mockUser); // sender lookup for notification

      // No existing conversation
      mockPrisma.conversation.findMany.mockResolvedValueOnce([]);

      // Create conversation via $transaction
      mockPrisma.$transaction.mockImplementationOnce(
        async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
          const txPrisma = {
            ...mockPrisma,
            conversation: {
              ...mockPrisma.conversation,
              create: jest.fn().mockResolvedValueOnce({
                id: MOCK_CONVERSATION_ID,
                productId: null,
                createdAt: new Date('2025-01-01'),
                updatedAt: new Date('2025-01-01'),
              }),
            },
          };
          return fn(txPrisma);
        },
      );

      // Create notification
      mockPrisma.notification.create.mockResolvedValueOnce(mockNotification);

      // loadConversationResponse
      mockPrisma.conversation.findUniqueOrThrow.mockResolvedValueOnce({
        ...mockConversation,
        product: null,
      });
      mockPrisma.user.findMany.mockResolvedValueOnce([mockUser, mockRecipient]);
      mockPrisma.message.count.mockResolvedValueOnce(0);

      const result = await service.createConversation(MOCK_USER_ID, {
        recipientId: MOCK_RECIPIENT_ID,
        initialMessage: 'Hello!',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(MOCK_CONVERSATION_ID);
      expect(result.participants).toHaveLength(2);
    });

    it('should return existing conversation and send message if conversation already exists', async () => {
      // Recipient exists
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockRecipient);

      // Existing conversation found
      const existingConvParticipants = [
        {
          conversationId: MOCK_CONVERSATION_ID,
          userId: MOCK_USER_ID,
          lastReadAt: null,
          user: { id: MOCK_USER_ID, firstName: 'John', lastName: 'Doe', avatarUrl: null },
        },
        {
          conversationId: MOCK_CONVERSATION_ID,
          userId: MOCK_RECIPIENT_ID,
          lastReadAt: null,
          user: { id: MOCK_RECIPIENT_ID, firstName: 'Jane', lastName: 'Smith', avatarUrl: null },
        },
      ];
      mockPrisma.conversation.findMany.mockResolvedValueOnce([
        {
          ...mockConversation,
          participants: existingConvParticipants,
        },
      ]);

      // User lookup for enriching participants
      mockPrisma.user.findMany.mockResolvedValueOnce([mockUser, mockRecipient]);

      // createMessageRecord $transaction
      mockPrisma.$transaction.mockImplementationOnce(
        async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
          const txPrisma = {
            ...mockPrisma,
            message: {
              ...mockPrisma.message,
              create: jest.fn().mockResolvedValueOnce(mockMessage),
            },
            conversation: {
              ...mockPrisma.conversation,
              update: jest.fn().mockResolvedValueOnce(mockConversation),
            },
          };
          return fn(txPrisma);
        },
      );

      // Create notification
      mockPrisma.notification.create.mockResolvedValueOnce(mockNotification);

      // loadConversationResponse
      mockPrisma.conversation.findUniqueOrThrow.mockResolvedValueOnce({
        ...mockConversation,
        product: null,
      });
      mockPrisma.user.findMany.mockResolvedValueOnce([mockUser, mockRecipient]);
      mockPrisma.message.count.mockResolvedValueOnce(0);

      const result = await service.createConversation(MOCK_USER_ID, {
        recipientId: MOCK_RECIPIENT_ID,
        initialMessage: 'Hello again!',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(MOCK_CONVERSATION_ID);
    });
  });

  // ---------------------------------------------------------------------------
  // sendMessage
  // ---------------------------------------------------------------------------

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValueOnce(mockConversation);

      mockPrisma.$transaction.mockImplementationOnce(
        async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
          const txPrisma = {
            ...mockPrisma,
            message: {
              ...mockPrisma.message,
              create: jest.fn().mockResolvedValueOnce(mockMessage),
            },
            conversation: {
              ...mockPrisma.conversation,
              update: jest.fn().mockResolvedValueOnce(mockConversation),
            },
          };
          return fn(txPrisma);
        },
      );

      mockPrisma.notification.create.mockResolvedValueOnce(mockNotification);

      const result = await service.sendMessage(
        MOCK_CONVERSATION_ID,
        MOCK_USER_ID,
        { content: 'Hello!' },
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(MOCK_MESSAGE_ID);
      expect(result.content).toBe('Hello!');
      expect(result.senderName).toBe('John Doe');
    });

    it('should throw NotFoundException when conversation does not exist', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.sendMessage('non-existent', MOCK_USER_ID, {
          content: 'Hello!',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not a participant', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValueOnce({
        ...mockConversation,
        participants: [
          { conversationId: MOCK_CONVERSATION_ID, userId: MOCK_RECIPIENT_ID, lastReadAt: null },
          { conversationId: MOCK_CONVERSATION_ID, userId: 'user-003', lastReadAt: null },
        ],
      });

      await expect(
        service.sendMessage(MOCK_CONVERSATION_ID, MOCK_USER_ID, {
          content: 'Hello!',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ---------------------------------------------------------------------------
  // markAsRead
  // ---------------------------------------------------------------------------

  describe('markAsRead', () => {
    it('should mark messages as read and update lastReadAt', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValueOnce(mockConversation);

      mockPrisma.$transaction.mockResolvedValueOnce([
        { count: 3 },
        {
          conversationId: MOCK_CONVERSATION_ID,
          userId: MOCK_USER_ID,
          lastReadAt: new Date(),
        },
      ]);

      await service.markAsRead(MOCK_CONVERSATION_ID, MOCK_USER_ID);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when conversation does not exist', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.markAsRead('non-existent', MOCK_USER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not a participant', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValueOnce({
        ...mockConversation,
        participants: [
          { conversationId: MOCK_CONVERSATION_ID, userId: 'user-003', lastReadAt: null },
          { conversationId: MOCK_CONVERSATION_ID, userId: 'user-004', lastReadAt: null },
        ],
      });

      await expect(
        service.markAsRead(MOCK_CONVERSATION_ID, MOCK_USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      mockPrisma.notification.create.mockResolvedValueOnce(mockNotification);

      const result = await service.createNotification(
        MOCK_USER_ID,
        NotificationType.ORDER_UPDATE,
        'Order Shipped',
        'Your order has been shipped.',
        '/orders/order-001',
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(MOCK_NOTIFICATION_ID);
      expect(result.type).toBe(NotificationType.ORDER_UPDATE);
      expect(result.title).toBe('Order Shipped');
      expect(result.isRead).toBe(false);
    });

    it('should create a notification with metadata', async () => {
      const metadata = { orderId: 'order-001', status: 'shipped' };
      mockPrisma.notification.create.mockResolvedValueOnce({
        ...mockNotification,
        metadata: JSON.stringify(metadata),
      });

      const result = await service.createNotification(
        MOCK_USER_ID,
        NotificationType.ORDER_UPDATE,
        'Order Shipped',
        'Your order has been shipped.',
        '/orders/order-001',
        metadata,
      );

      expect(result).toBeDefined();
      expect(result.metadata).toEqual(metadata);
    });
  });

  describe('getNotifications', () => {
    it('should return paginated notifications', async () => {
      mockPrisma.notification.findMany.mockResolvedValueOnce([mockNotification]);
      mockPrisma.notification.count.mockResolvedValueOnce(1);

      const result = await service.getNotifications(MOCK_USER_ID, {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter notifications by type', async () => {
      mockPrisma.notification.findMany.mockResolvedValueOnce([]);
      mockPrisma.notification.count.mockResolvedValueOnce(0);

      const result = await service.getNotifications(MOCK_USER_ID, {
        page: 1,
        limit: 20,
        type: NotificationType.PAYMENT_UPDATE,
      });

      expect(result.data).toHaveLength(0);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: NotificationType.PAYMENT_UPDATE,
          }),
        }),
      );
    });
  });

  describe('markNotificationRead', () => {
    it('should mark a notification as read', async () => {
      mockPrisma.notification.findUnique.mockResolvedValueOnce(mockNotification);
      mockPrisma.notification.update.mockResolvedValueOnce({
        ...mockNotification,
        isRead: true,
      });

      const result = await service.markNotificationRead(
        MOCK_NOTIFICATION_ID,
        MOCK_USER_ID,
      );

      expect(result.isRead).toBe(true);
    });

    it('should throw NotFoundException when notification does not exist', async () => {
      mockPrisma.notification.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.markNotificationRead('non-existent', MOCK_USER_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when notification belongs to another user', async () => {
      mockPrisma.notification.findUnique.mockResolvedValueOnce({
        ...mockNotification,
        userId: MOCK_RECIPIENT_ID,
      });

      await expect(
        service.markNotificationRead(MOCK_NOTIFICATION_ID, MOCK_USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('markAllNotificationsRead', () => {
    it('should mark all unread notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValueOnce({ count: 5 });

      const result = await service.markAllNotificationsRead(MOCK_USER_ID);

      expect(result.count).toBe(5);
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID, isRead: false },
        data: { isRead: true },
      });
    });
  });

  describe('getUnreadNotificationCount', () => {
    it('should return unread notification count', async () => {
      mockPrisma.notification.count.mockResolvedValueOnce(7);

      const result = await service.getUnreadNotificationCount(MOCK_USER_ID);

      expect(result).toBe(7);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID, isRead: false },
      });
    });
  });
});
