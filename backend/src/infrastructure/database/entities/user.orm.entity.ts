import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoleEntity } from './role.entity';
import { PermissionEntity } from './permission.entity';
import { UserSettingsEntity } from './user-settings.entity';
import { UserRefreshTokenEntity } from './user-refresh-token.entity';

@Entity('users')
export class UserOrmEntity {
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
  status: 'active' | 'inactive' | 'suspended';

  @Column({ nullable: true, type: 'varchar' })
  rememberToken: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => RoleEntity, (role) => role.users)
  @JoinTable({
    name: 'model_has_roles',
    joinColumn: { name: 'model_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: RoleEntity[];

  @ManyToMany(() => PermissionEntity, (permission) => permission.users)
  @JoinTable({
    name: 'model_has_permissions',
    joinColumn: { name: 'model_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissionsRelation: PermissionEntity[];

  @OneToOne(() => UserSettingsEntity, (settings) => settings.user)
  settings: UserSettingsEntity | null;

  @OneToMany(() => UserRefreshTokenEntity, (refreshToken) => refreshToken.user)
  refreshTokens: UserRefreshTokenEntity[];
}
