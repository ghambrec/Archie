import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SetDocumentGroupDto {
  @ApiProperty()
  @IsUUID()
  groupId!: string;
}
