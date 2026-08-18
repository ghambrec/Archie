import { ApiProperty } from "@nestjs/swagger";
import { GroupMemberDto } from "./group-members.dto";

export class GetGroupsMembersResponseDto {
  @ApiProperty()
  groupId!: string;

  @ApiProperty()
  groupName!: string;

  @ApiProperty({ type: [GroupMemberDto] })
  members!: GroupMemberDto[];
}