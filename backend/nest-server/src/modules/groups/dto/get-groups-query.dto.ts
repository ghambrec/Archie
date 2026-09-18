import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class GetGroupsQueryDto {
	@ApiPropertyOptional({ description: 'Exact group name to filter' })
	@IsOptional()
	@IsString()
	name?: string;
}
