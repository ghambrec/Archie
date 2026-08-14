import { UserGroup } from '../../user-groups/entities/user-group.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @Column({ type: 'boolean', name: 'is_system', default: false })
  isSystem!: boolean;

  @OneToMany(() => UserGroup, ug => ug.group)
  groupUsers!: UserGroup[];
}
