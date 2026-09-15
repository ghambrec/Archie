import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller'
import { GroupsService } from './groups.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { SessionModule } from '../auth/session/session.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { UserGroup } from '../user-groups/entities/user-group.entity';
import { DocumentGroup } from '../document-groups/entities/document-group.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      UserGroup,
      DocumentGroup
    ]),
    SessionModule,
    PermissionsModule
  ],
  exports: [
    TypeOrmModule,
    GroupsService
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
