import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateGroupsDto {
  @ApiProperty({ example: 'group_name'})
  @IsString()
  name!: string;

  id!: string;

}