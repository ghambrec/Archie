import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class UpdateUserDto {
	@ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MinLength(1)
    displayName?: string;

    @IsOptional()
    @IsString()
    @Length(2, 20)
    preferredLanguage?: string;


    @IsOptional()
    @IsString()
    @IsEmail()
    @MinLength(4)
    email?: string;


}
