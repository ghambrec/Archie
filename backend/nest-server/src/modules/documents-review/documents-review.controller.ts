import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Put, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { DocumentsReviewService } from './documents-review.service';
import { DocumentReviewResponse } from './dto/document-review-response.dto';
import type { Request } from 'express';
import { ReviewDocumentTagsDto } from './dto/review-document-tags.dto';

@ApiTags('documents-review')
@UseGuards(SessionAuthGuard)
@Controller('documents-review')
export class DocumentsReviewController {
	constructor(private readonly documentsReviewService: DocumentsReviewService) { }

	@Get()
	@ApiOkResponse({ type: [DocumentReviewResponse] })
	@ApiOperation({
		summary: 'Get all documents currently in ai pipeline and not reviewed',
	})
	async getDocsInAiPipeline(@Req() req: Request): Promise<DocumentReviewResponse[]> {
		return this.documentsReviewService.getDocsInAiPipeline(req.userId!);
	}

	@Put(':id/tags')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({
		summary: 'Assign given tags to the document, delete all other tags before',
	})
	async reviewTags(
		@Req() req: Request,
		@Param('id', new ParseUUIDPipe()) docId: string,
		@Body() dto: ReviewDocumentTagsDto
	): Promise<void> {
		return this.documentsReviewService.reviewTags(req.userId!, docId, dto.tagIds);
	}
}
