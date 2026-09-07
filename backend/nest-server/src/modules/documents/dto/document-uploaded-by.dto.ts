import { ApiProperty } from '@nestjs/swagger';

export class DocumentUploadedByDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}
