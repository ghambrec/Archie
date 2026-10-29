import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { FILENAME_MAX_LENGTH } from '../document-file.constants';

export class RenameDocumentDto {
  @ApiProperty({ description: 'New filename without extension' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(FILENAME_MAX_LENGTH)
  filename!: string;
}
