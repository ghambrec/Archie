import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Group } from '../../groups/entities/group.entity';
import { Permission } from '../../permissions/entities/permission.entity';

@Entity('group_permission')
export class GroupPermission {
  @PrimaryColumn({ type: 'uuid', name: 'group_id' })
  groupId!: string;

  @PrimaryColumn({ type: 'uuid', name: 'permission_id' })
  permissionId!: string;

  @ManyToOne(() => Group)
  @JoinColumn({ name: 'group_id' })
  group!: Group;

  @ManyToOne(() => Permission)
  @JoinColumn({ name: 'permission_id' })
  permission!: Permission;
}
