import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('user_permission')
@Unique('UQ_user_permission_user_group_permission', [
  'userId',
  'groupId',
  'permissionId',
])
export class UserPermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'uuid', name: 'group_id' })
  groupId!: string;

  @Column({ type: 'uuid', name: 'permission_id' })
  permissionId!: string;
}
