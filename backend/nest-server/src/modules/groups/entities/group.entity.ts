import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('groups') // database entity - mapped to 'groups'
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @Column({ type: 'boolean', default: false })
  isSystem!: boolean;
}