import { ApiProperty } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty({ nullable: true })
  parentId!: string | null;

  @ApiProperty()
  documentCount!: number;
}
