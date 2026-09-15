import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { DocumentTag } from './entities/document-tag.entity';
import { TagsController } from './tags.controller';
import { AdminTagsController } from './admin-tags.controller';
import { TagsService } from './tags.service';
import { AdminTagsService } from './admin-tags.service';
import { SessionModule } from '../auth/session/session.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, DocumentTag]), SessionModule, PermissionsModule],
  controllers: [TagsController, AdminTagsController],
  providers: [TagsService, AdminTagsService],
  exports: [TypeOrmModule, TagsService],
})
export class TagsModule {}
