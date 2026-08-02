import { ApiProperty } from "@nestjs/swagger";

export class CreateGroupsResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}