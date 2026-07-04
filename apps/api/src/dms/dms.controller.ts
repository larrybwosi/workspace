import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
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
import { DmsService } from './dms.service';
import { IsString, IsArray, IsOptional } from 'class-validator';

class CreateDmDto {
  @IsString()
  @ApiProperty({ example: 'user_123', description: 'The ID of the user to start a DM with' })
  userId: string;
}

class CreateDmMessageDto {
  @IsString()
  @ApiProperty({ example: 'Hello!' })
  content: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  replyToId?: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({ required: false, type: 'array', items: { type: 'object' } })
  attachments?: any[];
}

class UpdateDmMessageDto {
  @IsString()
  @ApiProperty({ example: 'Updated message content' })
  content: string;
}

class MarkAsReadDto {
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ type: [String], example: ['msg_1', 'msg_2'] })
  messageIds: string[];
}

@ApiTags('Direct Messages')
@ApiBearerAuth()
@Controller('dms')
@UseGuards(AuthGuard)
export class DmsController {
  constructor(private readonly dmsService: DmsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all DM conversations for the current user' })
  @ApiResponse({ status: 200, description: 'List of DM conversations' })
  async getDms(@CurrentUser() user: User) {
    return this.dmsService.getDms(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Start a new DM conversation' })
  @ApiBody({ type: CreateDmDto })
  @ApiResponse({ status: 201, description: 'DM conversation created' })
  async createDm(@CurrentUser() user: User, @Body() body: CreateDmDto) {
    return this.dmsService.createDm(user.id, body.userId, user.name || 'Someone');
  }

  @Get(':conversationId')
  @ApiOperation({ summary: 'Get DM conversation details' })
  @ApiParam({ name: 'conversationId', description: 'The conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation details' })
  @ApiResponse({ status: 404, description: 'DM not found' })
  async getDm(@Param('conversationId') conversationId: string, @CurrentUser() user: User) {
    const dm = await this.dmsService.getDm(conversationId, user.id);
    if (!dm) {
      throw new NotFoundException('DM not found');
    }
    return dm;
  }

  @Delete(':conversationId')
  @ApiOperation({ summary: 'Delete a DM conversation' })
  @ApiParam({ name: 'conversationId', description: 'The conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation deleted successfully' })
  async deleteDm(@Param('conversationId') conversationId: string) {
    return this.dmsService.deleteDm(conversationId);
  }

  @Get(':conversationId/messages')
  @ApiOperation({ summary: 'Get messages in a DM conversation' })
  @ApiParam({ name: 'conversationId', description: 'The conversation ID' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Pagination cursor' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of messages to return' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  async getMessages(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: User,
    @Query('cursor') cursor?: string,
    @Query('limit') limitNum = '50'
  ) {
    return this.dmsService.getMessages(conversationId, user.id, cursor, parseInt(limitNum));
  }

  @Post(':conversationId/messages')
  @ApiOperation({ summary: 'Send a message in a DM' })
  @ApiParam({ name: 'conversationId', description: 'The conversation ID' })
  @ApiBody({ type: CreateDmMessageDto })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async createMessage(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: User,
    @Body() body: CreateDmMessageDto
  ) {
    return this.dmsService.createMessage(conversationId, user.id, body);
  }

  @Patch(':conversationId/messages/:messageId')
  @ApiOperation({ summary: 'Update a DM message' })
  @ApiParam({ name: 'conversationId', description: 'The conversation ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiBody({ type: UpdateDmMessageDto })
  @ApiResponse({ status: 200, description: 'Message updated' })
  async updateMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: User,
    @Body() body: UpdateDmMessageDto
  ) {
    return this.dmsService.updateMessage(conversationId, messageId, user.id, body.content);
  }

  @Delete(':conversationId/messages/:messageId')
  @ApiOperation({ summary: 'Delete a DM message' })
  @ApiParam({ name: 'conversationId', description: 'The conversation ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiResponse({ status: 200, description: 'Message deleted' })
  async deleteMessage(@Param('conversationId') conversationId: string, @Param('messageId') messageId: string) {
    return this.dmsService.deleteMessage(conversationId, messageId);
  }

  @Post(':conversationId/messages/read')
  @ApiOperation({ summary: 'Mark messages as read in a DM' })
  @ApiParam({ name: 'conversationId', description: 'The conversation ID' })
  @ApiBody({ type: MarkAsReadDto })
  @ApiResponse({ status: 201, description: 'Messages marked as read' })
  async markAsRead(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: User,
    @Body() body: MarkAsReadDto
  ) {
    return this.dmsService.markAsRead(user.id, body.messageIds, conversationId);
  }

  @Post(':conversationId/messages/:messageId/reactions')
  @ApiOperation({ summary: 'Add a reaction to a DM message' })
  @ApiParam({ name: 'conversationId', description: 'The conversation ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiBody({ schema: { type: 'object', properties: { emoji: { type: 'string', example: '👍' } } } })
  @ApiResponse({ status: 201, description: 'Reaction added' })
  async addReaction(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: User,
    @Body() body: { emoji: string }
  ) {
    return this.dmsService.addReaction(conversationId, messageId, user.id, body.emoji);
  }

  @Delete(':conversationId/messages/:messageId/reactions/:emoji')
  @ApiOperation({ summary: 'Remove a reaction from a DM message' })
  @ApiParam({ name: 'conversationId', description: 'The conversation ID' })
  @ApiParam({ name: 'messageId', description: 'The message ID' })
  @ApiParam({ name: 'emoji', description: 'The emoji to remove' })
  @ApiResponse({ status: 200, description: 'Reaction removed' })
  async removeReaction(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
    @CurrentUser() user: User
  ) {
    return this.dmsService.removeReaction(conversationId, messageId, user.id, emoji);
  }
}
