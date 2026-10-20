import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Length } from 'class-validator';
import { Transform } from 'class-transformer';

// client Request
export class CreateUserDto {
  @ApiProperty({ example: 'test@example.com' })
  @Transform(({ value }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value
  )
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Max' })
  @Transform(({ value }) =>
  typeof value === 'string' ? value.trim() : value
  )
  @IsString()
  @Length(1, 25)
  displayName!: string;
  
}
