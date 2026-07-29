import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength, IsString } from 'class-validator';

export class RegisterRequestDto {
    @ApiProperty()
    @IsEmail()
    email!: string;
  
    @ApiProperty()
    @IsString()
    @MinLength(8)
    password!: string;
  
    @ApiProperty()
    @IsString()
    displayName!: string;
}
