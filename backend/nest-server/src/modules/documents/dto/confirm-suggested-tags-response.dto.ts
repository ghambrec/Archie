import { ApiProperty } from '@nestjs/swagger';

export class ConfirmSuggestedTagsResponseDto {
  @ApiProperty()
  documentId!: string;

  @ApiProperty({
    type: [String],
    description: 'IDs of the AI-suggested tags that were newly assigned to the document.',
  })
  confirmedTagIds!: string[];
}
