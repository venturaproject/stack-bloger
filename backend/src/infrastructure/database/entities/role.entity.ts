import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToMany,
} from 'typeorm';
import { PermissionEntity } from './permission.entity';
import { UserOrmEntity } from './user.orm.entity';

@Entity('roles')
export class RoleEntity {
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

  @ManyToMany(() => PermissionEntity, (p) => p.roles)
  permissions: PermissionEntity[];

  @ManyToMany(() => UserOrmEntity, (u) => u.roles)
  users: UserOrmEntity[];
}
