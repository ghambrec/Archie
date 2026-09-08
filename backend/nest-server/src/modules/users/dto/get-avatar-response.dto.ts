import type { Readable } from 'stream';

export class GetAvatarResponseDto {
  stream!: Readable;
  sizeBytes!: number;
  mimeType!: string;
}
