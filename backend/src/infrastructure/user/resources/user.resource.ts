import { UserEntity } from '../../../domain/user/entities/user.entity';

export class UserResource {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  username: string | null;
  email: string;
  status: string;
  role: string;
  roles: string[];
  role_names: string[];
  avatar: string | null;
  lastActivity: string | null;
  createdAt: string;
  updatedAt: string;

  constructor(user: UserEntity) {
    const [firstName, ...rest] = user.name.split(' ');
    this.id = String(user.id);
    this.name = user.name;
    this.firstName = firstName;
    this.lastName = rest.join(' ');
    this.username = user.username;
    this.email = user.email;
    this.status = user.status;
    this.role = user.role;
    this.roles = user.roleNames;
    this.role_names = user.roleNames;
    this.avatar = user.avatar;
    this.lastActivity = null;
    this.createdAt = user.createdAt.toISOString();
    this.updatedAt = user.updatedAt.toISOString();
  }

  static from(user: UserEntity): UserResource {
    return new UserResource(user);
  }

  static collection(users: UserEntity[]): UserResource[] {
    return users.map((u) => new UserResource(u));
  }
}
