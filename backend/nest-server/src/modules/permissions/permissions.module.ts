import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserGroup } from '../user-groups/entities/user-group.entity';
import { Permission } from './entities/permission.entity';
import { AdminRequiredGuard } from './guards/admin-required.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { PermissionsService } from './permissions.service';
import { SelfOrAdminGuard } from './guards/self-or-admin.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, UserGroup])],
  providers: [PermissionsService, PermissionsGuard, AdminRequiredGuard, SelfOrAdminGuard],
  exports: [PermissionsService, PermissionsGuard, AdminRequiredGuard, SelfOrAdminGuard],
})
export class PermissionsModule {}
