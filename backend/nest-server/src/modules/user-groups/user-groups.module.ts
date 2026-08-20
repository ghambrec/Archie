import { Module } from '@nestjs/common';
import { UserGroupsService } from './user-groups.service';
import { UserGroupsController } from './user-groups.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserGroup } from './entities/user-group.entity';
import { UsersModule } from '../users/users.module';
import { GroupsModule } from '../groups/groups.module';
import { AuthModule } from '../auth/auth.module';
import { Group } from '../groups/entities/group.entity';
import { User } from '../users/entities/user.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { AdminUserGroupsController } from './admin-user-groups.controller';
import { AdminUserGroupsService } from './admin-user-groups.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserGroup, Group, User]),
    UsersModule,
    GroupsModule,
    AuthModule,
    PermissionsModule,
  ],
  providers: [
    UserGroupsService,
    AdminUserGroupsService,
  ],
  controllers: [
    UserGroupsController,
    AdminUserGroupsController,
  ],
  exports: [
    UserGroupsService,
    AdminUserGroupsService
  ],
})
export class UserGroupsModule {}