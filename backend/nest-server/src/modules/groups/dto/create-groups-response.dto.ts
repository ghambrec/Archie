import { ApiProperty } from "@nestjs/swagger";
import { Group } from "../entities/group.entity";

export class CreateGroupsResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  constructor( group: Group ) {
    this.id = group.id;
    this.name = group.name;
  }
}