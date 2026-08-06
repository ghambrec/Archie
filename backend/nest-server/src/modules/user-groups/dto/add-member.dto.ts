import { ApiProperty } from "@nestjs/swagger";
import { IsUUID, IsNotEmpty } from "class-validator";

export class AddMemberDto {
  @ApiProperty({ example: '-- userId --' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;
}

