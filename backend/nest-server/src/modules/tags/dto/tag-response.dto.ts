import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  label!: string;

  @ApiPropertyOptional()
  facet?: string;

  @ApiProperty({ nullable: true })
  parentId!: string | null;

  @ApiPropertyOptional()
  documentCount?: number;
}
