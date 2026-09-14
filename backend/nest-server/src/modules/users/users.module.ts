import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { UserGroup } from '../user-groups/entities/user-group.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersFileService } from './users-file.service';
import { SessionModule } from '../auth/session/session.module';
import { StorageModule } from '../storage/storage.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Group, UserGroup]), SessionModule, StorageModule, PermissionsModule],
  exports: [TypeOrmModule, UsersService, UsersFileService],
  controllers: [UsersController],
  providers: [UsersService, UsersFileService],
})
export class UsersModule {}
