import { Injectable } from '@nestjs/common';
import { DocumentReviewResponse, DocumentReviewSuggestion } from './dto/document-review-response.dto';
import { Logger } from 'nestjs-pino';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Document } from '../documents/entities/document.entity';
import { ApplicationException } from 'src/common/errors/application.exception';
import { ErrorCode } from 'src/common/errors/error-code';
import { Tag } from '../tags/entities/tag.entity';
import { DocumentTag } from '../tags/entities/document-tag.entity';

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

	async reviewTags(userId: string, docId: string, tagIds: string[]): Promise<void> {
		this.logger.log({ userId, docId, tagIds }, 'reviewing document tags');

		await this.documentRepository.manager.transaction(async (manager) => {

			// load doc ai status
			const rows = await manager.query<{ aiStatus: string }[]>(
				`
					SELECT COALESCE(ad.status, 'NOT_STARTED') AS "aiStatus"
					FROM documents AS d
					LEFT JOIN ai_documents AS ad
						ON ad.id = d.id
					WHERE
						d.id = $1
						AND d.uploaded_by = $2
						AND d.deleted_at IS NULL
					FOR UPDATE OF d
				`,
				[docId, userId]
			);
			const document = rows[0];
			if (!document) {
				throw new ApplicationException(ErrorCode.DocumentNotFound);
			}

			// if doc is still processing ai pipeline review is forbidden
			if (document.aiStatus === 'PENDING' || document.aiStatus === 'PROCESSING') {
				throw new ApplicationException(ErrorCode.DocumentStillProcessing);
			}

			// requested tag all exist and not null?
			if (tagIds.length > 0) {
				const existingCount = await manager.countBy(Tag, { id: In(tagIds) });
				if (existingCount !== tagIds.length) {
					throw new ApplicationException(ErrorCode.TagNotFound);
				}
			}

			// delete already existing tags
			await manager.delete(DocumentTag, { documentId: docId });

			// insert new tags
			if (tagIds.length > 0) {
				const suggestionRows = await manager.query<{ tagId: string }[]>(
					`
						SELECT ai_tag_id AS "tagId"
						FROM ai_document_tags
						WHERE
								ai_document_id = $1
								AND ai_tag_id IS NOT NULL
					`,
					[docId]
				);
				const suggestedTagIds = new Set(suggestionRows.map((row) => row.tagId));

				await manager.insert(
					DocumentTag,
					tagIds.map((tagId) => ({
						documentId: docId,
						tagId,
						assignedBy: suggestedTagIds.has(tagId) ? null : userId,
					}))
				);
			}

			// mark doc as reviewed
			await manager.update(Document, { id: docId }, {reviewedAiAt: new Date() });
		});

		this.logger.log({ userId, docId, count: tagIds.length }, 'document tags reviewed successfully');
	}
}
