import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupsDto {
  @ApiProperty({ example: 'group_name'})
  @IsString()
  name!: string;

  @ApiProperty({ example: 'readonly group'})
  description!: string;

  @ApiProperty({ example: 'false'})
  isSystem!: string;

}