import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty(
    {example: 'test@example.com'},
  )
  @IsEmail()
  email!: string;

  
  @ApiProperty(
    {example: 'password1234'},
  ) 
  @IsString()
  password!: string;
}
