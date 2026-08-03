import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class UserInfoDto {
  @ApiProperty(
    {example: 'test@example.com'},
  )
  @IsEmail()
  email!: string;

  
  @ApiProperty(
    {example: 'password123'},
  ) 
  @IsString()
  password!: string;
}
