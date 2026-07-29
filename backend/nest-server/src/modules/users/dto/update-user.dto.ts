import { ApiPropertyOptional } from '@nestjs/swagger';
import { isEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';

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
    //@isEmail()
    @MinLength(1)
    email?: string;


}
