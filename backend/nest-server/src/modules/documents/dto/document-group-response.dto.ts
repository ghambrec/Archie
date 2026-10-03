import { ApiProperty } from '@nestjs/swagger';

export class DocumentGroupResponseDto {
  @ApiProperty()
  documentId!: string;

  @ApiProperty()
  groupId!: string;
}
