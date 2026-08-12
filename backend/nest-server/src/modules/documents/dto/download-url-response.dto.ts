import { ApiProperty } from '@nestjs/swagger';

export class DownloadUrlResponseDto {
  @ApiProperty()
  url!: string;

  @ApiProperty()
  expiresInSeconds!: number;
}
