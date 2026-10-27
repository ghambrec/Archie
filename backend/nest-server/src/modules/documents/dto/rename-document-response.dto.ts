import { ApiProperty } from '@nestjs/swagger';

export class RenameDocumentResponseDto {
  @ApiProperty()
  documentId!: string;

  @ApiProperty()
  filename!: string;
}
