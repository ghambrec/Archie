import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { SessionModule } from '../auth/session/session.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [SessionModule, StorageModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
