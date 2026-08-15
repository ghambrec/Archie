import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller'
import { AdminGroupsController } from './admin-groups.controller';
import { GroupsService } from './groups.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { SessionModule } from '../auth/session/session.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { UserGroup } from '../user-groups/entities/user-group.entity';
import { AdminGroupsService } from './admin-groups.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, UserGroup]),
    SessionModule,
    PermissionsModule
  ],
  exports: [
    TypeOrmModule,
    GroupsService
  ],
  controllers: [
    GroupsController,
    AdminGroupsController],
  providers: [
    GroupsService,
    AdminGroupsService],
})
export class GroupsModule {}
