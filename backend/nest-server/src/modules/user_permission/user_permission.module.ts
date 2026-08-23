import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../permissions/entities/permission.entity';
import { UserPermission } from './entities/user_permission.entity';
import { GroupPermissionGuard } from './guards/group-permission.guard';
import { UserPermissionController } from './user_permission.controller';
import { UserPermissionService } from './user_permission.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserPermission, Permission])],
  controllers: [UserPermissionController],
  providers: [UserPermissionService, GroupPermissionGuard],
  exports: [UserPermissionService, GroupPermissionGuard],
})
export class UserPermissionModule {}
