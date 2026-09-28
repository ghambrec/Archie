import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GroupMinimalDto } from '../../user-groups/dto/group-minimal.dto';
import { DocumentAiStatus } from './document-ai-status.enum';
import { DocumentUploadedByDto } from './document-uploaded-by.dto';
import { DocumentTagDto } from './document-tag.dto';

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

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({ type: DocumentUploadedByDto })
  uploadedBy!: DocumentUploadedByDto;

  @ApiProperty({ type: GroupMinimalDto, isArray: true })
  groups!: GroupMinimalDto[];

  @ApiProperty({ type: DocumentTagDto, isArray: true })
  tags!: DocumentTagDto[];

  @ApiProperty({ enum: DocumentAiStatus })
  aiStatus!: DocumentAiStatus;

  @ApiPropertyOptional()
  aiSummary?: string;

  @ApiProperty()
  language!: string;

  @ApiPropertyOptional({ nullable: true })
  aiErrorKey?: string | null;
}
