import { ApiProperty } from "@nestjs/swagger";

export class GroupMinimalDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}