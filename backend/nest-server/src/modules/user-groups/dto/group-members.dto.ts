import { ApiProperty } from "@nestjs/swagger";

export class GroupMemberDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  joinedAt!: Date;
}