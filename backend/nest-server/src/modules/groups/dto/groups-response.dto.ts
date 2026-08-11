import { ApiProperty } from "@nestjs/swagger";
import { Group } from "../entities/group.entity";

export class GroupsResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string | null;
  constructor( group: Group ) {
    this.id = group.id;
    this.name = group.name;
    this.description = group.description;
  }
}