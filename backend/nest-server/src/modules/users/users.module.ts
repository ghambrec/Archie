import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SessionModule } from '../auth/session/session.module';
import { MinioModule } from '../minio/minio.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), SessionModule, MinioModule],
  exports: [TypeOrmModule, UsersService],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
