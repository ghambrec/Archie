import { ApiProperty } from '@nestjs/swagger';
import { DocumentSummaryDto } from './document-summary.dto';

export class GetDocumentsResponseDto {
  @ApiProperty({ type: [DocumentSummaryDto] })
  data!: DocumentSummaryDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}
