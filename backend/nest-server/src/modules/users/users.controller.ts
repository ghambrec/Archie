import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserResponseDto } from './dto/create-user-response.dto';
import { UpdateUserResponseDto } from './dto/update-user-response.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('create')
  async create(@Body() dto: CreateUserDto): Promise<CreateUserResponseDto> {
    return this.usersService.create(dto);
  }
  @Patch(':id')
  async update (@Param('id') userId: string, @Body() dto: UpdateUserResponseDto): Promise<UpdateUserResponseDto> {
    return this.usersService.updateProfile(userId, dto);
  }

  //@GetEndpoints
}
