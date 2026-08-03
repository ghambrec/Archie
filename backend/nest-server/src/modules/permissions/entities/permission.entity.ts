import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', name: 'perm_key', unique: true })
  permKey!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;
}
