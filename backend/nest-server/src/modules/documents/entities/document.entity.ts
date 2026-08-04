import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DocumentStatus {
  Uploaded = 'UPLOADED',
  Processing = 'PROCESSING',
  Ready = 'READY',
  Failed = 'FAILED',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'uploaded_by' })
  uploadedBy!: string;

  @Column({ type: 'varchar', name: 'filename' })
  filename!: string;

  @Column({ type: 'varchar', name: 'mime_type' })
  mimeType!: string;

  @Column({ type: 'bigint', name: 'size_bytes' })
  sizeBytes!: number;

  @Column({ type: 'varchar', name: 'sha256' })
  sha256!: string;

  @Column({ type: 'integer', name: 'page_count', nullable: true })
  pageCount!: number | null;

  @Column({ type: 'text', name: 'ai_summary', nullable: true })
  aiSummary!: string | null;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    name: 'status',
    default: DocumentStatus.Uploaded,
  })
  status!: DocumentStatus;

  @Column({ type: 'varchar', name: 'language', nullable: true })
  language!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt!: Date | null;
}
