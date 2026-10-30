import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import type { Request, Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from 'src/modules/auth/guards/session-auth.guard';
import { AskConversationDto } from './dto/ask-conversation.dto';
import { RenameConversationDto } from './dto/rename-conversation.dto';

@ApiTags('conversations')
@UseGuards(SessionAuthGuard)
@Controller('conversations')
export class ConversationsController {
	constructor(private readonly conversations: ConversationsService) {}

	@ApiOperation({
	summary: 'create new conversation for current user',
	description: 'calls ai-service in background',
	})
	@Post()
	@HttpCode(201)
	createConversation(@Req() req: Request) {
		return this.conversations.createConversation(req.userId!);
	}

	@ApiOperation({
	summary: 'get all conversations from current user',
	description: 'calls ai-service in background',
	})
	@Get()
	getConversations(@Req() req: Request) {
		return this.conversations.getConversations(req.userId!);
	}

	@ApiOperation({
	summary: 'ask something related to a conversation',
	description: 'calls ai-service in background',
	})
	@UseInterceptors(ChatDurationInterceptor)
	@Post(':convId/ask')
  async ask(@Req() req: Request, @Res({ passthrough: true }) res: Response,
    @Param('convId', new ParseUUIDPipe()) id: string, @Body() dto: AskConversationDto) {
    const controller = new AbortController();
    const disconnect = () => { if (!res.writableEnded) controller.abort(); };
    res.once('close', disconnect);
    try {
      return await this.conversations.ask(req.userId!, id, dto.question, controller.signal);
    } finally {
      res.off('close', disconnect);
    }
  }

	@ApiOperation({
	summary: 'get chat history from a conversation',
	description: 'calls ai-service in background',
	})
	@Get(':convId/messages')
	getMessages(@Req() req: Request, @Param('convId') id: string) {
		return this.conversations.getMessages(req.userId!, id);
	}

  @ApiOperation({ summary: 'rename a conversation for the current user' })
  @Patch(':convId')
  renameConversation(
    @Req() req: Request,
    @Param('convId', new ParseUUIDPipe()) id: string,
    @Body() dto: RenameConversationDto,
  ) {
    return this.conversations.renameConversation(req.userId!, id, dto.title);
  }

	@ApiOperation({
	summary: 'delete a conversation',
	description: 'calls ai-service in background',
	})
	@Delete(':convId')
	deleteConversation(@Req() req: Request, @Param('convId') id: string) {
		return this.conversations.deleteConversation(req.userId!, id);
	}

	@ApiOperation({
	summary: 'delete all conversation of current user',
	description: 'calls ai-service in background',
	})
	@Delete()
	deleteAllConversations(@Req() req: Request) {
		return this.conversations.deleteAllConversations(req.userId!);
	}
}
