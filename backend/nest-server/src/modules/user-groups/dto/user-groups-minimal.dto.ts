import { ApiProperty } from "@nestjs/swagger";
import { GroupMinimalDto } from "src/modules/user-groups/dto/group-minimal.dto";
import { UserMinimalDto } from "src/modules/user-groups/dto/user-minimal.dto";

export class UserGroupsMinimalDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  groupId!: string;

  @ApiProperty()
  joinedAt!: Date;

  @ApiProperty({ type: UserMinimalDto })
  user!: UserMinimalDto;

  @ApiProperty({ type: GroupMinimalDto })
  group!: GroupMinimalDto;
}