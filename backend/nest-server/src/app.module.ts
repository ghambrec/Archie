import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { GroupsModule } from './modules/groups/groups.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { UserGroupsModule } from './modules/user-groups/user-groups.module';
import { GroupPermissionsModule } from './modules/group-permissions/group-permissions.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { DocumentGroupsModule } from './modules/document-groups/document-groups.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './modules/redis/redis.module';
import { GroupsController } from './modules/groups/groups.controller';
import { AppLoggerModule } from './logger/app-logger.module';
import { MinioModule } from './modules/minio/minio.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      autoLoadEntities: true,
      synchronize: false,
    }),
    UsersModule,
    GroupsModule,
    PermissionsModule,
    UserGroupsModule,
    GroupPermissionsModule,
    DocumentsModule,
    DocumentGroupsModule,
    RedisModule,
    AuthModule,
    AppLoggerModule,
    MinioModule,
    StorageModule,
  ],
  controllers: [AppController, GroupsController],
  providers: [AppService],
})
export class AppModule {}
