import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController
{
	constructor(private readonly usersService: UsersService) {}

	@Post('signup')
	signup(@Body() dto: CreateUserDto)
	{
		return this.usersService.create(dto);
	}
}
