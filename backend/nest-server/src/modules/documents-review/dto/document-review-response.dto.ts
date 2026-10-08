import { ApiProperty } from "@nestjs/swagger";

export class DocumentReviewSuggestion {
	@ApiProperty()
	tagId!: string;

	@ApiProperty()
	name!: string;

	@ApiProperty()
	label!: string;

	@ApiProperty({ minimum: 0, maximum: 1 })
	confidence!: number;
}

export class DocumentReviewResponse {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	filename!: string;

	@ApiProperty()
	mimeType!: string;

	@ApiProperty()
	sizeBytes!: number;

	@ApiProperty({ type: String, format: 'date-time' })
	createdAt!: Date;

	@ApiProperty()
	aiStatus!: string;

	@ApiProperty({ type: String, nullable: true })
	aiErrorKey!: string | null;

	@ApiProperty({ type: [DocumentReviewSuggestion] })
	suggestions!: DocumentReviewSuggestion[];
}
