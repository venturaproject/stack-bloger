import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToMany,
} from 'typeorm';
import { PermissionEntity } from './permission.entity';
import { UserEntity } from '../../../domain/user/entities/user.entity';

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

  @ManyToMany(() => UserEntity, (u) => u.roles)
  users: UserEntity[];
}
