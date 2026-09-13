import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { DocumentTag } from './entities/document-tag.entity';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { SessionModule } from '../auth/session/session.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, DocumentTag]), SessionModule],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TypeOrmModule, TagsService],
})
export class TagsModule {}
