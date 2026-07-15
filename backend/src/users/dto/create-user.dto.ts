import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
	@ApiProperty({ example: 'test@example.com' })
	@IsEmail()
	email!: string;

	@ApiProperty({ example: 'password123' })
	@IsString()
	@MinLength(8)
	password!: string;

	@ApiPropertyOptional({ example: 'max' })
	@IsOptional()
	@IsString()
	first_name?: string;

	@ApiPropertyOptional({ example: 'mustermann' })
	@IsOptional()
	@IsString()
	last_name?: string;
}
