import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller'
import { AdminGroupsController } from './admin-groups.controller';
import { GroupsService } from './groups.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { SessionModule } from '../auth/session/session.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { UserGroupsService } from '../user-groups/user-groups.service';
import { UserGroup } from '../user-groups/entities/user-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Group, UserGroup]), SessionModule, PermissionsModule],
  exports: [TypeOrmModule, GroupsService],
  controllers: [GroupsController, AdminGroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
