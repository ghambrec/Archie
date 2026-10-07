import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { DocumentsReviewService } from './documents-review.service';
import { DocumentReviewResponse } from './dto/document-review-response.dto';
import type { Request } from 'express';

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
}
