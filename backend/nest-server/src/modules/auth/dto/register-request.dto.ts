import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength, IsString } from 'class-validator';

export class RegisterRequestDto {
    @ApiProperty({ example: 'test@example.com' })
    @IsEmail()
    email!: string;
  
    @ApiProperty({ example: 'password1234' })
    @IsString()
    @MinLength(8)
    password!: string;
  
    @ApiProperty({ example: 'nik' })
    @IsString()
    displayName!: string;
}
