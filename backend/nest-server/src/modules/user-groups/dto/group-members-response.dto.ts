import { ApiProperty } from "@nestjs/swagger";
import { UserGroupsMinimalDto } from "./user-groups-minimal.dto";

export class GetGroupsMembersResponseDto {
  @ApiProperty()
  groupId!: string;

  @ApiProperty()
  groupName!: string;

  @ApiProperty({ type: [UserGroupsMinimalDto] })
  members!: UserGroupsMinimalDto[];
}