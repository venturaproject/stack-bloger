import { UserEntity } from '../../../domain/user/entities/user.entity';
import { UserOrmEntity } from '../entities/user.orm.entity';

export class UserMapper {
  static toDomain(user: UserOrmEntity): UserEntity {
    return Object.assign(new UserEntity(), {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      emailVerifiedAt: user.emailVerifiedAt,
      password: user.password,
      status: user.status,
      rememberToken: user.rememberToken,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: (user.roles ?? []).map((role) => ({
        id: role.id,
        name: role.name,
        permissions: (role.permissions ?? []).map((permission) => ({ id: permission.id, name: permission.name })),
      })),
      permissionsRelation: (user.permissionsRelation ?? []).map((permission) => ({ id: permission.id, name: permission.name })),
      settings: user.settings ? {
        avatar: user.settings.avatar,
        theme: user.settings.theme,
        font: user.settings.font,
        language: user.settings.language,
      } : null,
    });
  }
}
