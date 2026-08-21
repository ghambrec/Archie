import { ApiProperty } from "@nestjs/swagger";
import { UserGroupMembershipDto } from "./user-groups-membership.dto";

export class GetGroupsByUserIdResponseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ type: [UserGroupMembershipDto] })
  groups!: UserGroupMembershipDto[]
}