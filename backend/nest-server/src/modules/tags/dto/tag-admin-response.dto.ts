import { ApiProperty } from '@nestjs/swagger';
import { Tag } from '../entities/tag.entity';

export class TagAdminResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty()
  facet!: string;

  @ApiProperty({ nullable: true })
  parentId!: string | null;

  @ApiProperty()
  isSystem!: boolean;

  constructor(tag: Tag) {
    this.id = tag.id;
    this.name = tag.name;
    this.label = tag.label;
    this.description = tag.description;
    this.facet = tag.facet;
    this.parentId = tag.parentId;
    this.isSystem = tag.isSystem;
  }
}
