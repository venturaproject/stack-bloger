import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToOne,
  OneToMany,
} from 'typeorm';
// Relaciones por string + import type: rompe los ciclos de importación entre entidades.
import type { RoleEntity } from '../../../infrastructure/database/entities/role.entity';
import type { PermissionEntity } from '../../../infrastructure/database/entities/permission.entity';
import type { UserSettingsEntity } from '../../../infrastructure/database/entities/user-settings.entity';
import type { UserRefreshTokenEntity } from '../../../infrastructure/database/entities/user-refresh-token.entity';

export type UserStatus = 'active' | 'inactive' | 'suspended';
export type UserRole = 'admin' | 'editor' | 'viewer';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ type: 'varchar', unique: true, length: 100, nullable: true })
  username: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  emailVerifiedAt: Date | null;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: UserStatus;

  @Column({ nullable: true, type: 'varchar' })
  rememberToken: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany('RoleEntity', (role: RoleEntity) => role.users, { cascade: false })
  @JoinTable({
    name: 'model_has_roles',
    joinColumn: { name: 'model_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: RoleEntity[];

  @ManyToMany('PermissionEntity', (permission: PermissionEntity) => permission.users, { cascade: false })
  @JoinTable({
    name: 'model_has_permissions',
    joinColumn: { name: 'model_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissionsRelation: PermissionEntity[];

  @OneToOne('UserSettingsEntity', (settings: UserSettingsEntity) => settings.user)
  settings: UserSettingsEntity | null;

  @OneToMany('UserRefreshTokenEntity', (refreshToken: UserRefreshTokenEntity) => refreshToken.user)
  refreshTokens: UserRefreshTokenEntity[];

  isActive(): boolean {
    return this.status === 'active';
  }

  get roleNames(): string[] {
    return this.roles?.map((role) => role.name) ?? [];
  }

  get role(): UserRole {
    const primaryRole = this.roles?.[0]?.name;
    if (primaryRole === 'admin' || primaryRole === 'editor' || primaryRole === 'viewer') {
      return primaryRole;
    }

    return 'viewer';
  }

  get permissions(): string[] {
    const rolePermissions = this.roles?.flatMap((role) => role.permissions?.map((permission) => permission.name) ?? []) ?? [];
    const directPermissions = this.permissionsRelation?.map((permission) => permission.name) ?? [];

    return Array.from(new Set([...rolePermissions, ...directPermissions])).sort();
  }

  get directPermissions(): string[] {
    return this.permissionsRelation?.map((permission) => permission.name).sort() ?? [];
  }

  hasAnyRole(requiredRoles: string[]): boolean {
    return this.roleNames.some((role) => requiredRoles.includes(role));
  }
}
