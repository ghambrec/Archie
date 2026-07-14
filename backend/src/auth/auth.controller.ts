import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController
{
	constructor(
		private readonly usersService: UsersService,
		private readonly authService: AuthService
	) {}

	@Post('signup')
	signup(@Body() dto: CreateUserDto)
	{
		return this.usersService.create(dto);
	}

	@Post('login')
	login(@Body() dto: LoginDto)
	{
		return this.authService.login(dto);
	}
}
