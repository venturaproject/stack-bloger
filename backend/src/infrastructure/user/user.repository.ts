import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../domain/user/entities/user.entity';
import {
  IUserRepository,
  PaginatedResult,
  UserFilters,
  UserStats,
} from '../../domain/user/repositories/user.repository.interface';
import { RoleEntity } from '../database/entities/role.entity';
import { PermissionEntity } from '../database/entities/permission.entity';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly orm: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleOrm: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionOrm: Repository<PermissionEntity>,
  ) {}

  findById(id: number): Promise<UserEntity | null> {
    return this.orm.findOne({
      where: { id },
      relations: { roles: { permissions: true }, settings: true, permissionsRelation: true },
    });
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.orm.findOne({
      where: { email: email.toLowerCase() },
      relations: { roles: { permissions: true }, settings: true, permissionsRelation: true },
    });
  }

  findByUsername(username: string): Promise<UserEntity | null> {
    return this.orm.findOne({
      where: { username },
      relations: { roles: { permissions: true }, settings: true, permissionsRelation: true },
    });
  }

  async getPaginated(filters: UserFilters): Promise<PaginatedResult<UserEntity>> {
    const page = filters.page ?? 1;
    const perPage = filters.perPage ?? 20;

    const qb = this.orm
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('role.permissions', 'rolePermission')
      .leftJoinAndSelect('user.settings', 'settings')
      .leftJoinAndSelect('user.permissionsRelation', 'directPermission')
      .distinct(true);

    if (filters.search) {
      qb.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search OR user.username ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.status) {
      qb.andWhere('user.status = :status', { status: filters.status });
    }

    if (filters.role) {
      qb.andWhere('role.name = :role', { role: filters.role });
    }

    const total = await qb.getCount();

    const data = await qb
      .orderBy('user.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    return {
      data,
      total,
      page,
      perPage,
      lastPage: Math.ceil(total / perPage),
    };
  }

  async create(data: Partial<UserEntity>): Promise<UserEntity> {
    const user = this.orm.create(await this.prepareData(data));
    return this.orm.save(user);
  }

  async update(user: UserEntity, data: Partial<UserEntity>): Promise<UserEntity> {
    Object.assign(user, await this.prepareData(data));
    return this.orm.save(user);
  }

  async delete(user: UserEntity): Promise<void> {
    await this.orm.remove(user);
  }

  async generateUsername(name: string): Promise<string> {
    const base = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
    let username = base;
    let counter = 1;

    while (await this.orm.findOneBy({ username })) {
      username = `${base}${counter}`;
      counter++;
    }

    return username;
  }

  async getStats(): Promise<UserStats> {
    const [total, active, inactive, suspended] = await Promise.all([
      this.orm.count(),
      this.orm.count({ where: { status: 'active' } }),
      this.orm.count({ where: { status: 'inactive' } }),
      this.orm.count({ where: { status: 'suspended' } }),
    ]);

    return { total, active, inactive, suspended };
  }

  async getRoleOptions(): Promise<Array<{ id: number; name: string }>> {
    const roles = await this.roleOrm.find({ order: { name: 'ASC' } });
    return roles.map((role) => ({ id: role.id, name: role.name }));
  }

  async getPermissionOptions(): Promise<Array<{ id: number; name: string }>> {
    const permissions = await this.permissionOrm.find({ order: { name: 'ASC' } });
    return permissions.map((permission) => ({ id: permission.id, name: permission.name }));
  }

  async syncPermissions(user: UserEntity, permissions: string[]): Promise<UserEntity> {
    const permissionEntities = permissions.length > 0
      ? await this.permissionOrm.findBy(permissions.map((name) => ({ name })))
      : [];

    user.permissionsRelation = permissionEntities;
    return this.orm.save(user);
  }

  private async prepareData(data: Partial<UserEntity>): Promise<Partial<UserEntity>> {
    const prepared: Partial<UserEntity> = { ...data };

    if (data.roles) {
      const roleNames = data.roles.map((role) => role.name);
      prepared.roles = roleNames.length > 0
        ? await this.roleOrm.findBy(roleNames.map((name) => ({ name })))
        : [];
    }

    if (data.permissionsRelation) {
      const permissionNames = data.permissionsRelation.map((permission) => permission.name);
      prepared.permissionsRelation = permissionNames.length > 0
        ? await this.permissionOrm.findBy(permissionNames.map((name) => ({ name })))
        : [];
    }

    return prepared;
  }
}
