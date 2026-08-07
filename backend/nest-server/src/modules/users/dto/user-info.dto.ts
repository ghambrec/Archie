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

  @ApiProperty({ example: 'de' })
  preferredLanguage!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true, 
    example: '2026-08-06T12:30:00.000Z',
  })
  lastLoginAt!: Date | null;
}
