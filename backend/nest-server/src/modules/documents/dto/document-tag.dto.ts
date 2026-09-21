import { ApiProperty } from '@nestjs/swagger';

export class DocumentTagDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  label!: string;
}
