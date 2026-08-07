import { ApiProperty, ApiTags } from "@nestjs/swagger";
import { UserGroup } from "../entities/user-group.entity";

export class GetUserGroupsResponseDto {
  @ApiProperty({ type: [UserGroup] })
  data!: UserGroup[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 150 })
  total!: number;

  @ApiProperty({ example: 8 })
  totalPages!: number;
}