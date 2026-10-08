import { Injectable } from '@nestjs/common';
import { UserEntity } from '../../../domain/user/entities/user.entity';

@Injectable()
export class GetCurrentUserProfileUseCase {
  execute(user: UserEntity) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      roles: user.roleNames,
      permissions: user.permissions,
      avatar: user.avatar,
    };
  }
}
