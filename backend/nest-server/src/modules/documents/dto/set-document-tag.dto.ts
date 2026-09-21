import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SetDocumentTagDto {
  @ApiProperty()
  @IsUUID()
  tagId!: string;
}
