import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { hashPassword } from './password.utils';

@Injectable()
export class UsersService
{
	constructor(private readonly prisma: PrismaService) {}

	findAll()
	{
		return this.prisma.users.findMany();
	}

	findByMail(email: string)
	{
		return this.prisma.users.findUnique({ where: { email: email } });
	}

	async create(dto: CreateUserDto)
	{
		const existing = await this.findByMail(dto.email);
		if (existing)
		{
			throw new ConflictException('Email already registered');
		}

		const hashed_password = await hashPassword(dto.password);

		return this.prisma.users.create({
			data: {
				email: dto.email,
				password_hash: hashed_password,
				first_name: dto.first_name,
				last_name: dto.last_name
			}
		});
	}
}
