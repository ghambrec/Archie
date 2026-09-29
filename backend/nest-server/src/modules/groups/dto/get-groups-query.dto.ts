import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class GetGroupsQueryDto {
	@ApiPropertyOptional({ description: 'Exact group name to filter' })
	@IsOptional()
	@IsString()
	name?: string;

	@ApiPropertyOptional({ description: 'Only return groups where the user has this permission', example: 'documents.read' })
	@IsOptional()
	@IsString()
	permission?: string;
}
