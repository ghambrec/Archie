import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('document_tags')
export class DocumentTag {
  @PrimaryColumn({ type: 'uuid', name: 'document_id' })
  documentId!: string;

  @PrimaryColumn({ type: 'uuid', name: 'tag_id' })
  tagId!: string;

  @Column({ type: 'uuid', name: 'assigned_by', nullable: true })
  assignedBy!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
