import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { Document } from './entities/document.entity';
import { SessionModule } from '../auth/session/session.module';
import { StorageModule } from '../storage/storage.module';
import { GroupsModule } from '../groups/groups.module';
import { DocumentGroupsModule } from '../document-groups/document-groups.module';
import { AiServiceModule } from '../ai-service/ai-service.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document]),
    SessionModule,
    StorageModule,
    GroupsModule,
    DocumentGroupsModule,
    AiServiceModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
