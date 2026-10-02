import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';


export class ChangePasswordDto {
	@ApiPropertyOptional()
    @IsString()
    @MinLength(8)
    password!: string;
}
