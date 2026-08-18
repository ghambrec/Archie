import { ApiProperty } from "@nestjs/swagger";
import { UserGroupsMinimalDto } from "./user-groups-minimal.dto";

export class GetGroupsByUserIdResponseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  displayname!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ type: [UserGroupsMinimalDto] })
  groups!: UserGroupsMinimalDto[]
}