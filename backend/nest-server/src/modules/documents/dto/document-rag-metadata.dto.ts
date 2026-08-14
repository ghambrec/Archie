import { ApiProperty } from '@nestjs/swagger';

export class DocumentRagMetadataDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  uploadedBy!: string;

  @ApiProperty({ nullable: true })
  groupId!: string | null;
}
