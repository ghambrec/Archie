import { Module } from '@nestjs/common';
import { UserGroupsService } from './user-groups.service';
import { UserGroupsController } from './user-groups.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserGroup } from './entities/user-group.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserGroup]), UsersModule, GroupsModule],
  providers: [UserGroupsService],
  controllers: [UserGroupsController],
  exports: [UserGroupsService],
})
export class UserGroupsModule {}
