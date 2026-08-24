import { ApiProperty } from '@nestjs/swagger';

export class DocumentSummaryDto {
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
}
