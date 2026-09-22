import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';


export class UpdateUserPasswordDto {
	@ApiPropertyOptional({
        example: 'password1234'
    })
	@IsOptional()
    @IsString()
    @MinLength(8)
    old_password?: string;

    @ApiPropertyOptional({
        example: 'NEWpassword1234'
    })
	@IsOptional()
    @IsString()
    @MinLength(8)
    new_password?: string;

}
