import { Module } from '@nestjs/common';
import { DocumentsReviewService } from './documents-review.service';
import { DocumentsReviewController } from './documents-review.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from '../documents/entities/document.entity';
import { DocumentTag } from '../tags/entities/document-tag.entity';
import { Tag } from '../tags/entities/tag.entity';
import { SessionModule } from '../auth/session/session.module';

@Module({
	providers: [DocumentsReviewService],
	controllers: [DocumentsReviewController],
	imports: [
		SessionModule,
		TypeOrmModule.forFeature([Document, DocumentTag, Tag])
	]
})
export class DocumentsReviewModule { }
