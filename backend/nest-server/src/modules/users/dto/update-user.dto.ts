import { ApiPropertyOptional } from '@nestjs/swagger';
import { SupportedLanguage } from '../enums/supported-language.enum';
import { IsEmail, IsEnum,  IsOptional, IsString, Length,MinLength } from 'class-validator';

export class UpdateUserDto {
	@ApiPropertyOptional({
        example: 'gabriel'
    })
    @IsOptional()
    @IsString()
    @MinLength(1)
    displayName?: string;

    @ApiPropertyOptional({
        enum: SupportedLanguage,
        example: SupportedLanguage.English,
    })
    @IsOptional()
    @IsString()
    @IsEnum(SupportedLanguage)
    @Length(2, 4)
    preferredLanguage?: SupportedLanguage;


    @ApiPropertyOptional({
        example: 'example@gmail.com'
    })
    @IsOptional()
    @IsString()
    @IsEmail()
    @MinLength(4)
    email?: string;

    

    @ApiPropertyOptional({
        example: 'password123456'
    })
    @IsOptional()
    @IsString()
    @MinLength(8)
    password?: string


}
