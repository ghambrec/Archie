import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';


// client Request
export class UploadResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  objectKey!: string;
}
