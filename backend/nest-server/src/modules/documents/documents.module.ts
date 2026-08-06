import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { SessionModule } from '../auth/session/session.module';

@Module({
  controllers: [DocumentsController, SessionModule],
  providers: [DocumentsService]
})

export class DocumentsModule {}
