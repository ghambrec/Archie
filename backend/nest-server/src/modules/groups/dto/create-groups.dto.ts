import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateGroupsDto {
  @ApiProperty({ example: 'group_4'})
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'readonly group'})
  @IsString()
  @IsOptional()
  description?: string;

  // @ApiProperty({ example: false})
  // @IsBoolean()
  // @IsOptional()
  // @Transform(({ value }) => value === 'true' || value === true )
  // isSystem?: boolean = false;

}