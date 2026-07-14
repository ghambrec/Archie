import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule],
  controllers: [AppController],
  providers: [AppService, {provide: APP_GUARD, useClass: AuthGuard}],
})
export class AppModule {}
