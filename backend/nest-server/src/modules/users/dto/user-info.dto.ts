import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsUUID } from 'class-validator';

export class UserInfoDto {
  @ApiProperty({ example: 'b3f1c2e4-...' })
  @IsUUID()
  id!: string;

  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Max' })
  @IsString()
  displayName!: string;
}
