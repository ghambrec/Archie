import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { verifyPassword } from '../users/password.utils';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService
{
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService
	) {};
	
	async login(dto: LoginDto)
	{
		const user = await this.usersService.findByMail(dto.email);
		if (!user)
		{
			throw new UnauthorizedException('Email or password wrong');
		}

		const passwordValid = await verifyPassword(user.password_hash, dto.password);
		if (!passwordValid)
		{
			throw new UnauthorizedException('Email or password wrong');
		}

		const payload = { sub: user.id, email: user.email };
		const accessToken = await this.jwtService.signAsync(payload);

		return { access_token: accessToken };
	}
}
