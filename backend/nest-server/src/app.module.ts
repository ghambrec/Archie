import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { PermissionsModule } from './permissions/permissions.module';
import { UserGroupsModule } from './user-groups/user-groups.module';
import { GroupPermissionsModule } from './group-permissions/group-permissions.module';
import { DocumentsModule } from './documents/documents.module';
import { DocumentGroupsModule } from './document-groups/document-groups.module';

@Module({
  imports: [UsersModule, GroupsModule, PermissionsModule, UserGroupsModule, GroupPermissionsModule, DocumentsModule, DocumentGroupsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
