import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController
{
	constructor(
		private readonly usersService: UsersService,
		private readonly authService: AuthService
	) {}

	@Public()
	@Post('signup')
	signup(@Body() dto: CreateUserDto)
	{
		return this.usersService.create(dto);
	}

	@Public()
	@Post('login')
	login(@Body() dto: LoginDto)
	{
		return this.authService.login(dto);
	}
}
