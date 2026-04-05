import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@/common/decorators/current-user.decorator';
import { MessagingService, PaginatedResponse } from './messaging.service';
import {
  ConversationResponseDto,
  CreateConversationDto,
  MessageResponseDto,
  NotificationResponseDto,
  QueryConversationsDto,
  QueryNotificationsDto,
  SendMessageDto,
} from './dto';

@ApiTags('Messaging')
@ApiBearerAuth('access-token')
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  // ---------------------------------------------------------------------------
  // CONVERSATIONS
  // ---------------------------------------------------------------------------

  @Post('conversations')
  @ApiOperation({ summary: 'Create or find a conversation with another user' })
  @ApiCreatedResponse({
    description: 'Conversation created or existing conversation returned with new message',
    type: ConversationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Cannot create conversation with yourself' })
  @ApiNotFoundResponse({ description: 'Recipient or product not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async createConversation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    return this.messagingService.createConversation(user.sub, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List conversations for the current user' })
  @ApiOkResponse({
    description: 'Paginated list of conversations',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getConversations(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryConversationsDto,
  ): Promise<PaginatedResponse<ConversationResponseDto>> {
    return this.messagingService.getConversations(user.sub, query);
  }

  @Get('conversations/:id')
  @ApiOperation({
    summary: 'Get a conversation with all messages (auto-marks as read)',
  })
  @ApiOkResponse({
    description: 'Conversation detail with messages',
  })
  @ApiNotFoundResponse({ description: 'Conversation not found' })
  @ApiForbiddenResponse({ description: 'Not a participant in this conversation' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getConversation(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{
    conversation: ConversationResponseDto;
    messages: MessageResponseDto[];
  }> {
    return this.messagingService.getConversation(id, user.sub);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiCreatedResponse({
    description: 'Message sent successfully',
    type: MessageResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Conversation not found' })
  @ApiForbiddenResponse({ description: 'Not a participant in this conversation' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    return this.messagingService.sendMessage(id, user.sub, dto);
  }

  @Post('conversations/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all messages in a conversation as read' })
  @ApiOkResponse({ description: 'Messages marked as read' })
  @ApiNotFoundResponse({ description: 'Conversation not found' })
  @ApiForbiddenResponse({ description: 'Not a participant in this conversation' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.messagingService.markAsRead(id, user.sub);
    return { message: 'Messages marked as read' };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread message count across all conversations' })
  @ApiOkResponse({ description: 'Unread message count' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getUnreadCount(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ unreadCount: number }> {
    const unreadCount = await this.messagingService.getUnreadCount(user.sub);
    return { unreadCount };
  }

  // ---------------------------------------------------------------------------
  // NOTIFICATIONS
  // ---------------------------------------------------------------------------

  @Get('notifications')
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiOkResponse({ description: 'Paginated list of notifications' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getNotifications(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryNotificationsDto,
  ): Promise<PaginatedResponse<NotificationResponseDto>> {
    return this.messagingService.getNotifications(user.sub, query);
  }

  @Post('notifications/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiOkResponse({
    description: 'Notification marked as read',
    type: NotificationResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Notification not found' })
  @ApiForbiddenResponse({ description: 'Notification does not belong to you' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async markNotificationRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NotificationResponseDto> {
    return this.messagingService.markNotificationRead(id, user.sub);
  }

  @Post('notifications/read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all unread notifications as read' })
  @ApiOkResponse({ description: 'All notifications marked as read' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async markAllNotificationsRead(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ count: number }> {
    return this.messagingService.markAllNotificationsRead(user.sub);
  }

  @Get('notifications/unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiOkResponse({ description: 'Unread notification count' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getUnreadNotificationCount(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ unreadCount: number }> {
    const unreadCount = await this.messagingService.getUnreadNotificationCount(
      user.sub,
    );
    return { unreadCount };
  }
}
