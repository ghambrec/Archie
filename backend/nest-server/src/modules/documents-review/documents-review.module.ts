import { Module } from '@nestjs/common';
import { DocumentsReviewService } from './documents-review.service';
import { DocumentsReviewController } from './documents-review.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from '../documents/entities/document.entity';
import { DocumentTag } from '../tags/entities/document-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { SessionModule } from '../auth/session/session.module';
import { IngestionModule } from '../ai-service/ingestion/ingestion.module';

@Module({
	providers: [DocumentsReviewService],
	controllers: [DocumentsReviewController],
	imports: [
		SessionModule,
		TypeOrmModule.forFeature([Document, DocumentTag, Tag]),
		IngestionModule
	]
})
export class DocumentsReviewModule { }
