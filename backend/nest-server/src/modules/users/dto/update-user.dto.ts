import { ApiPropertyOptional } from '@nestjs/swagger';
import { SupportedLanguage } from '../enums/supported-language.enum';
import { IsEmail, IsEnum, isEnum,  IsOptional, IsString, Length,MinLength } from 'class-validator';
import { Transform } from 'class-transformer';


export class UpdateUserDto {
	@ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(1, 25)
    @Transform(({ value }) =>
      typeof value === 'string' ? value.trim() : value
    )
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
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value
    )
    email?: string;

    @ApiPropertyOptional({ example: 'password123' })
    @IsOptional()
    @IsString()
    @Length(8, 25)
    password!: string;

}
