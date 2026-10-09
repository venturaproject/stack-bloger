import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToMany, JoinTable,
} from 'typeorm';
import type { RoleEntity } from './role.entity';
import type { UserOrmEntity } from './user.orm.entity';

@Entity('permissions')
export class PermissionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 25, default: 'web' })
  guardName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany('RoleEntity', (r: RoleEntity) => r.permissions)
  @JoinTable({
    name: 'role_has_permissions',
    joinColumn: { name: 'permission_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: RoleEntity[];

  @ManyToMany('UserOrmEntity', (user: UserOrmEntity) => user.permissionsRelation)
  users: UserOrmEntity[];
}
