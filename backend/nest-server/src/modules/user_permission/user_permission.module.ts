import { Module } from '@nestjs/common';
import { UserPermissionController } from './user_permission.controller';
import { UserPermissionService } from './user_permission.service';

@Module({
  controllers: [UserPermissionController],
  providers: [UserPermissionService]
})
export class UserPermissionModule {}
