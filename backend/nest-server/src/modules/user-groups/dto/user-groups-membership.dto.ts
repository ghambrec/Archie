import { ApiProperty } from "@nestjs/swagger";

export class UserGroupMembershipDto {
  @ApiProperty()
  groupId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  joinedAt!: Date;
}