import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';


export class ChangePasswordDto {
	@ApiPropertyOptional()
	@IsOptional()
    @IsString()
    @MinLength(8)
    password?: string;
}
