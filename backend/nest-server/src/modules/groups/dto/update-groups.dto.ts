import { PartialType } from "@nestjs/swagger";
import { CreateGroupsDto } from "./create-groups.dto";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateGroupsDto extends PartialType(CreateGroupsDto) { // erbt alle felder von CreateGroupsDto - macht sie optional
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}