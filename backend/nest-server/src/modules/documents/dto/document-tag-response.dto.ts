import { ApiProperty } from '@nestjs/swagger';

export class DocumentTagResponseDto {
  @ApiProperty()
  documentId!: string;

  @ApiProperty()
  tagId!: string;
}
