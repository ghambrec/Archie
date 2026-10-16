import { ApiPropertyOptional } from '@nestjs/swagger';
import { SupportedLanguage } from '../enums/supported-language.enum';
import { IsEmail, IsEnum, isEnum,  IsOptional, IsString, Length,MinLength } from 'class-validator';

export class UpdateUserDto {
	@ApiPropertyOptional()
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

}
