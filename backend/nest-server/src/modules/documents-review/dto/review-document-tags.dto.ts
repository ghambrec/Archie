import { ApiProperty } from "@nestjs/swagger";
import { ArrayUnique, IsArray, IsUUID } from "class-validator";

export class ReviewDocumentTagsDto {
	@ApiProperty({ type: [String], format: 'uuid' })
	@IsArray()
	@IsUUID('all', { each: true })
	@ArrayUnique()
	tagIds!: string[];
}
