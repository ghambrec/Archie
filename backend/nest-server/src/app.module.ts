import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { GroupsModule } from './modules/groups/groups.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { UserGroupsModule } from './modules/user-groups/user-groups.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { DocumentGroupsModule } from './modules/document-groups/document-groups.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './modules/redis/redis.module';
import { GroupsController } from './modules/groups/groups.controller';
import { AppLoggerModule } from './logger/app-logger.module';
import { StorageModule } from './modules/storage/storage.module';
import { ConfigModule, ConfigType } from '@nestjs/config';
import authConfig from './config/auth.config';
import redisConfig from './config/redis.config';
import storageConfig from './config/storage.config';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        authConfig,
        databaseConfig,
        redisConfig,
        storageConfig
        ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],

      useFactory: (
        config: ConfigType<typeof databaseConfig>
      ) => {
        return {
          type: 'postgres',
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.password,
          database: config.dbName,
          autoLoadEntities: true,
          synchronize: false,

        }
      }
    }),
    UsersModule,
    GroupsModule,
    PermissionsModule,
    UserGroupsModule,
    DocumentsModule,
    DocumentGroupsModule,
    RedisModule,
    AuthModule,
    AppLoggerModule,
    StorageModule,
  ],
  controllers: [AppController, GroupsController],
  providers: [AppService],
})
export class AppModule {}
