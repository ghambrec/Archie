import { ApiProperty } from '@nestjs/swagger';
import { DocumentStatus } from '../entities/document-status.enum';

export class DocumentSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  filename!: string;

  @ApiProperty()
  mimeType!: string;

  @ApiProperty()
  sizeBytes!: number;

  @ApiProperty({ enum: DocumentStatus })
  status!: DocumentStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
