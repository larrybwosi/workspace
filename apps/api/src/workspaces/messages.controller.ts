import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '@repo/database';
import { MessagesService } from '@/workspaces/messages.service';
import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';

class CreateMessageDto {
  @IsString()
  @ApiProperty({ example: 'Hello world!' })
  content: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'msg_123' })
  replyToId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'thread_123' })
  threadId?: string;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false })
  metadata?: any;

  @IsArray()
  @IsOptional()
  @ApiProperty({ required: false, type: [Object] })
  attachments?: any[];

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  stickerId?: string;
}

class UpdateMessageDto {
  @IsString()
  @ApiProperty({ example: 'Updated content' })
  content: string;
}

class MarkMessagesAsReadDto {
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [String], example: ['msg_1', 'msg_2'] })
  messageIds: string[];
}

class AddReactionDto {
  @IsString()
  @ApiProperty({ example: '👍' })
  emoji: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'emoji_123' })
  customEmojiId?: string;
}

@ApiTags('Channels & Messages')
@ApiBearerAuth()
@Controller('workspaces/:slug/channels/:channelId/messages')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get messages from a channel' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Pagination cursor' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of messages to return' })
  @ApiQuery({ name: 'threadId', required: false, description: 'Filter by thread ID' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  async getMessages(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Query('cursor') cursor: string,
    @Query('limit') limitNum = '50',
    @Query('threadId') threadId?: string
  ) {
    await this.messagesService.verifyWorkspaceAccess(user.id, slug);
    return this.messagesService.getMessages(channelId, user.id, cursor, parseInt(limitNum), threadId);
  }

  @Post()
  @ApiOperation({ summary: 'Send a message to a channel' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiBody({ type: CreateMessageDto })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async createMessage(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Body() body: CreateMessageDto
  ) {
    await this.messagesService.verifyWorkspaceAccess(user.id, slug);
    return this.messagesService.createMessage(user.id, { ...body, channelId });
  }

  @Patch(':messageId')
  @ApiOperation({ summary: 'Update a message' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiBody({ type: UpdateMessageDto })
  @ApiResponse({ status: 200, description: 'Message updated' })
  async updateMessage(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Body() body: UpdateMessageDto
  ) {
    await this.messagesService.verifyWorkspaceAccess(user.id, slug);
    return this.messagesService.updateMessage(user.id, messageId, body.content);
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiResponse({ status: 200, description: 'Message deleted' })
  async deleteMessage(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string
  ) {
    await this.messagesService.verifyWorkspaceAccess(user.id, slug);
    return this.messagesService.deleteMessage(user.id, messageId);
  }

  @Post('read')
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiBody({ type: MarkMessagesAsReadDto })
  @ApiResponse({ status: 201, description: 'Messages marked as read' })
  async markAsRead(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Body() body: MarkMessagesAsReadDto
  ) {
    await this.messagesService.verifyWorkspaceAccess(user.id, slug);

    if (!Array.isArray(body.messageIds)) {
      throw new BadRequestException('Invalid messageIds');
    }

    return this.messagesService.batchMarkAsRead(user.id, body.messageIds, channelId);
  }

  @Post(':messageId/reactions')
  @ApiOperation({ summary: 'Add a reaction to a message' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiBody({ type: AddReactionDto })
  @ApiResponse({ status: 201, description: 'Reaction added' })
  async addReaction(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Body() body: AddReactionDto
  ) {
    await this.messagesService.verifyWorkspaceAccess(user.id, slug);
    return this.messagesService.addReaction(user.id, messageId, body.emoji, body.customEmojiId);
  }

  @Delete(':messageId/reactions/:emoji')
  @ApiOperation({ summary: 'Remove a reaction from a message' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiParam({ name: 'emoji', description: 'The emoji to remove' })
  @ApiResponse({ status: 200, description: 'Reaction removed' })
  async removeReaction(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string
  ) {
    await this.messagesService.verifyWorkspaceAccess(user.id, slug);
    return this.messagesService.removeReaction(user.id, messageId, emoji);
  }

  @Post(':messageId/replies')
  @ApiOperation({ summary: 'Create a reply to a message' })
  @ApiParam({ name: 'slug', description: 'The workspace slug' })
  @ApiParam({ name: 'channelId', description: 'The channel ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiBody({ type: CreateMessageDto })
  @ApiResponse({ status: 201, description: 'Reply created' })
  async createReply(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Body() body: CreateMessageDto
  ) {
    await this.messagesService.verifyWorkspaceAccess(user.id, slug);
    // Delegate entirely to createMessage so replies inherit mention, attachment, and sticker logic automatically
    return this.messagesService.createMessage(user.id, {
      ...body,
      channelId,
      replyToId: messageId,
    });
  }
}
