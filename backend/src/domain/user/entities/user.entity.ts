export type UserStatus = 'active' | 'inactive' | 'suspended';
export type UserRole = 'admin' | 'editor' | 'viewer';

export interface UserPermission {
  id?: number;
  name: string;
}

export interface UserRoleAssignment {
  id?: number;
  name: string;
  permissions?: UserPermission[];
}

export interface UserSettings {
  avatar: string | null;
  theme?: string | null;
  font?: string | null;
  language?: string | null;
}

export class UserEntity {
  id: number;

  name: string;

  email: string;

  username: string | null;

  emailVerifiedAt: Date | null;

  password: string;

  status: UserStatus;

  rememberToken: string | null;

  createdAt: Date;

  updatedAt: Date;

  roles: UserRoleAssignment[];

  permissionsRelation: UserPermission[];

  settings: UserSettings | null;

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
