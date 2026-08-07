import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { SessionModule } from '../auth/session/session.module';

@Module({
  imports: [TypeOrmModule.forFeature([Group]), SessionModule],
  exports: [TypeOrmModule, GroupsService],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
