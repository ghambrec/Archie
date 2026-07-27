import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { GroupsModule } from './modules/groups/groups.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { UserGroupsModule } from './modules/user-groups/user-groups.module';
import { GroupPermissionsModule } from './modules/group-permissions/group-permissions.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { DocumentGroupsModule } from './modules/document-groups/document-groups.module';

@Module({
  imports: [UsersModule, GroupsModule, PermissionsModule, UserGroupsModule, GroupPermissionsModule, DocumentsModule, DocumentGroupsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
