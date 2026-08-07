import { ApiProperty, ApiTags } from "@nestjs/swagger";
import { UserGroupsMinimalDto } from "./user-groups-minimal.dto";

export class GetUserGroupsMinimalResponseDto {
  @ApiProperty({ type: [UserGroupsMinimalDto] })
  data!: UserGroupsMinimalDto[]; //user soll nur id, name und email enthalten und group soll nur id, name enthalten

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 150 })
  total!: number;

  @ApiProperty({ example: 8 })
  totalPages!: number;
}