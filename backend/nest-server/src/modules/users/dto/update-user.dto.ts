import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MinLength } from 'class-validator';

export class UpdateUserDto {
	@ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MinLength(1)
    displayName?: string;

}
