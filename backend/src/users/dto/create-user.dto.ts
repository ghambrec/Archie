import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto
{
	@IsEmail()
	email!: string;

	@IsString()
	@MinLength(8)
	password!: string;

	@IsOptional()
	@IsString()
	first_name?: string;

	@IsOptional()
	@IsString()
	last_name?: string;
}
