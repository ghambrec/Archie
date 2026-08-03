import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserGroup } from '../user-groups/entities/user-group.entity';
import { Permission } from './entities/permission.entity';
import { AdminRequiredGuard } from './guards/admin-required.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { PermissionsService } from './permissions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Permission, UserGroup])],
  providers: [PermissionsService, PermissionsGuard, AdminRequiredGuard],
  exports: [PermissionsService, PermissionsGuard, AdminRequiredGuard],
})
export class PermissionsModule {}
