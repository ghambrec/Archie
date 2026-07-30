import { Req, Body,Get, Controller, Param, Patch, Post ,ParseUUIDPipe, UseGuards, ConflictException } from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserResponseDto } from './dto/create-user-response.dto';
import { UpdateUserResponseDto } from './dto/update-user-response.dto';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserSummaryDto } from './dto/user-summary.dto';
import { User } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  async create(@Body() dto: CreateUserDto): Promise<CreateUserResponseDto> {
    const userEntity = await this.usersService.create(dto);
    return {id: userEntity.id};
  }

  @UseGuards(SessionAuthGuard)
  @Patch('me')
  async updateCurrentUser (
    @Req() req: Request, 
    @Body() dto: UpdateUserDto): Promise<UpdateUserResponseDto> {
    return this.usersService.updateProfile(req.userId!, dto);
  }

  //@UseGuards(SessionAuthGuard)
  //@Patch ('me')
  //async updateMyself (@Req () ))

  
  @UseGuards(SessionAuthGuard)
  @Get(':me')
  async getCurrentUser( @Req() req: Request): Promise <UserSummaryDto> {
    return this.usersService.findProfileById(req.userId!);
  }

  @UseGuards(SessionAuthGuard)
  @Post('whoami')
  whoami(@Req() req: Request): { userId: string } {
    return { userId: req.userId! };
  }

}


