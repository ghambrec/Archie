import { ApiProperty } from "@nestjs/swagger";

export class UserMinimalDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  displayName!: string;
}