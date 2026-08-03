import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from '../../groups/entities/group.entity';

@Entity('user_groups')
export class UserGroup {
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @PrimaryColumn({ type: 'uuid', name: 'group_id' })
  groupId!: string;

  @Column({ type: 'uuid', name: 'invited_by', nullable: true })
  invitedBy!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'joined_at' })
  joinedAt!: Date;

  @ManyToOne(() => User) // AI recommendation:  (() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Group) // AI recommendation:  (() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group!: Group;

  @ManyToOne(() => User) // AI recommendation:  (() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invited_by' })
  inviter!: User | null;
}
