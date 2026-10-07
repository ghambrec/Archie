import { Injectable } from '@nestjs/common';
import { DocumentReviewResponse, DocumentReviewSuggestion } from './dto/document-review-response.dto';
import { Logger } from 'nestjs-pino';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../documents/entities/document.entity';

interface DocumentReviewRawRow {
	id: string;
	filename: string;
	mimeType: string;
	sizeBytes: string;   // bigint → String vom pg-Treiber
	createdAt: Date;
	aiStatus: string;
	aiErrorKey: string | null;
	suggestions: DocumentReviewSuggestion[];
}


@Injectable()
export class DocumentsReviewService {
	constructor(
		private readonly logger: Logger,
		@InjectRepository(Document)
		private readonly documentRepository: Repository<Document>
	) { }


	async getDocsInAiPipeline(userId: string): Promise<DocumentReviewResponse[]> {
		this.logger.log({ userId }, "requesting docs in ai pipeline");

		const rows = await this.documentRepository.query<DocumentReviewRawRow[]>(
			`
				SELECT 
					d.id,
					d.filename,
					d.mime_type AS "mimeType",
					d.size_bytes AS "sizeBytes",
					d.created_at AS "createdAt",
					COALESCE(ad.status, 'NOT_STARTED') AS "aiStatus",
					ad.error_key AS "aiErrorKey",
					COALESCE(
						json_agg(json_build_object('tagId', t.id, 'name', t.name, 'label', t.label, 'confidence', adt.confidence) ORDER BY adt.confidence DESC) FILTER (WHERE t.id IS NOT NULL),
						'[]'
					) AS "suggestions"
				FROM documents AS d 
				LEFT JOIN ai_documents AS ad 
					ON ad.id = d.id
				LEFT JOIN ai_document_tags AS adt 
					ON adt.ai_document_id = d.id 
					AND adt.ai_tag_id IS NOT NULL
				LEFT JOIN tags AS t 
					ON t.id = adt.ai_tag_id
				WHERE
					d.uploaded_by = $1
					AND d.deleted_at IS NULL
					AND d.reviewed_ai_at IS NULL
				GROUP BY d.id, ad.id
				ORDER BY d.created_at DESC
			`,
			[userId]
		);

		this.logger.log({ userId }, "successfully queried ai pipeline docs");

		return rows.map((row): DocumentReviewResponse => ({
			id: row.id,
			filename: row.filename,
			mimeType: row.mimeType,
			sizeBytes: Number(row.sizeBytes),
			createdAt: row.createdAt,
			aiStatus: row.aiStatus,
			aiErrorKey: row.aiErrorKey,
			suggestions: row.suggestions
		}));
	}
}
