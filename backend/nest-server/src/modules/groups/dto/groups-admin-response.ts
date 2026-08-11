import { ApiProperty } from "@nestjs/swagger";
import { GroupsResponseDto } from "./groups-response.dto";
import { Group } from "../entities/group.entity";

// export class GroupsAdminResponseDto extends GroupsResponseDto {
//   @ApiProperty()
//   isSystem!: boolean;
// }

export class GroupsAdminResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string | null;

  @ApiProperty()
  isSystem!: boolean;

  constructor( group: Group) {
    this.id = group.id;
    this.name = group.name;
    this.description = group.description;
    this.isSystem = group.isSystem;
  }
}