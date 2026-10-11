import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../permissions/entities/permission.entity';
import { UserPermission } from './entities/user_permission.entity';
import { UserPermissionController } from './user_permission.controller';
import { UserPermissionService } from './user_permission.service';
import { SessionModule } from '../auth/session/session.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { Group } from '../groups/entities/group.entity';
import { UserGroup } from '../user-groups/entities/user-group.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserPermission, Permission, Group, UserGroup]),
    SessionModule,
    PermissionsModule,
  ],
  controllers: [UserPermissionController],
  providers: [UserPermissionService],
  exports: [UserPermissionService],
})
export class UserPermissionModule {}
