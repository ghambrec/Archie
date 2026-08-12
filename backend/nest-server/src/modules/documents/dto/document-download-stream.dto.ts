import type { Readable } from 'stream';

export class DocumentDownloadStreamDto {
  stream!: Readable;
  filename!: string;
  mimeType!: string;
  sizeBytes!: number;
}
