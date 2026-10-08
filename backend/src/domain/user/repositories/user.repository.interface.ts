import { UserEntity, UserStatus } from '../entities/user.entity';

export interface UserFilters {
  search?: string;
  status?: UserStatus;
  role?: string;
  page?: number;
  perPage?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  findById(id: number): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  getPaginated(filters: UserFilters): Promise<PaginatedResult<UserEntity>>;
  create(data: Partial<UserEntity>): Promise<UserEntity>;
  update(user: UserEntity, data: Partial<UserEntity>): Promise<UserEntity>;
  delete(user: UserEntity): Promise<void>;
  generateUsername(name: string): Promise<string>;
  getStats(): Promise<UserStats>;
  getRoleOptions(): Promise<Array<{ id: number; name: string }>>;
  getPermissionOptions(): Promise<Array<{ id: number; name: string }>>;
  syncPermissions(user: UserEntity, permissions: string[]): Promise<UserEntity>;
}
