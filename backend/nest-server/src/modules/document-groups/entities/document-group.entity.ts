import { Entity, PrimaryColumn } from 'typeorm';

@Entity('document_groups')
export class DocumentGroup {
  @PrimaryColumn({ type: 'uuid', name: 'document_id' })
  documentId!: string;

  @PrimaryColumn({ type: 'uuid', name: 'group_id' })
  groupId!: string;
}
