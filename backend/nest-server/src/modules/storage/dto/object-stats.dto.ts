import { StoredObjectMetadataDto } from "./stored-object-metadat.dto";

export class ObjectStatsDto {
  size!: number;
  etag!: string;
  lastModified!: Date;
  metaData!: StoredObjectMetadataDto;
}