import { Req, Body, Controller, Param, Patch, Post , UseGuards, ConflictException } from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserResponseDto } from './dto/create-user-response.dto';
import { UpdateUserResponseDto } from './dto/update-user-response.dto';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  async create(@Body() dto: CreateUserDto): Promise<CreateUserResponseDto> {
    const MailExisting = await this.usersService.findByEmail(dto.email)
    if(MailExisting)
      throw new ConflictException('Email already registered');
    const DisplayNameExisting = await this.usersService.findByName(dto.displayName)
    if(DisplayNameExisting)
      throw new ConflictException('Display name already registered')
    return this.usersService.create(dto);
  }
  @Patch(':id')
  async update (@Param('id') userId: string, @Body() dto: UpdateUserResponseDto): Promise<UpdateUserResponseDto> {
    return this.usersService.updateProfile(userId, dto);
  }

  //@GetEndpoints

  @UseGuards(SessionAuthGuard)
  @Post('whoami')
  whoami(@Req() req: Request): { userId: string } {
    return { userId: req.userId! };
  }

  
}
