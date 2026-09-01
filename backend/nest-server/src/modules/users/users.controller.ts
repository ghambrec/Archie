import {
  Req,
  Body,Get,
  Controller,
  Patch,
  Post,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { UsersFileService } from './users-file.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserResponseDto } from './dto/create-user-response.dto';
import { UpdateUserResponseDto } from './dto/update-user-response.dto';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserSummaryDto } from './dto/user-summary.dto';
import { GetUsersResponseDto } from './dto/get-users-response.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { PatchAvatarResponseDto } from './dto/patch-avatar-response.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersFileService: UsersFileService,
  ) {}

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

  @UseGuards(SessionAuthGuard)
  @Get()
  async getAllUsers(@Query() request: GetUsersQueryDto): Promise<GetUsersResponseDto>{
    return this.usersService.getAllUsers(request);
  }
 
  @UseGuards(SessionAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Patch('me/avatar')
  async patchAvatar(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<PatchAvatarResponseDto> {
    return this.usersFileService.patchAvatarImage(req.userId!, file);
  }
  
  @UseGuards(SessionAuthGuard)
  @Get('me')
  async getCurrentUser( @Req() req: Request): Promise<Omit<UserSummaryDto, 'isAdmin'>> {
    return this.usersService.findProfileById(req.userId!);
  }

  @UseGuards(SessionAuthGuard)
  @Post('whoami')
  whoami(@Req() req: Request): { userId: string } {
    return { userId: req.userId! };
  }

}


