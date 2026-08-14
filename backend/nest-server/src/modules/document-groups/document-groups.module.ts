import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentGroup } from './entities/document-group.entity';
import { DocumentGroupsService } from './document-groups.service';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentGroup])],
  providers: [DocumentGroupsService],
  exports: [DocumentGroupsService],
})
export class DocumentGroupsModule {}
