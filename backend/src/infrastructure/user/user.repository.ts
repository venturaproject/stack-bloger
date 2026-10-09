import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../domain/user/entities/user.entity';
import { UserOrmEntity } from '../database/entities/user.orm.entity';
import { UserMapper } from '../database/mappers/user.mapper';
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
    @InjectRepository(UserOrmEntity)
    private readonly orm: Repository<UserOrmEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleOrm: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionOrm: Repository<PermissionEntity>,
  ) {}

  async findById(id: number): Promise<UserEntity | null> {
    const user = await this.orm.findOne({
      where: { id },
      relations: { roles: { permissions: true }, settings: true, permissionsRelation: true },
    });
    return user ? UserMapper.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.orm.findOne({
      where: { email: email.toLowerCase() },
      relations: { roles: { permissions: true }, settings: true, permissionsRelation: true },
    });
    return user ? UserMapper.toDomain(user) : null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const user = await this.orm.findOne({
      where: { username },
      relations: { roles: { permissions: true }, settings: true, permissionsRelation: true },
    });
    return user ? UserMapper.toDomain(user) : null;
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

    const rows = await qb
      .orderBy('user.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    return {
      data: rows.map(UserMapper.toDomain),
      total,
      page,
      perPage,
      lastPage: Math.ceil(total / perPage),
    };
  }

  async create(data: Partial<UserEntity>): Promise<UserEntity> {
    const user = await this.orm.save(this.orm.create(await this.prepareData(data)));
    return (await this.findById(user.id)) as UserEntity;
  }

  async update(user: UserEntity, data: Partial<UserEntity>): Promise<UserEntity> {
    const entity = await this.orm.findOne({
      where: { id: user.id },
      relations: { roles: { permissions: true }, settings: true, permissionsRelation: true },
    });
    if (!entity) return user;
    Object.assign(entity, await this.prepareData(data));
    await this.orm.save(entity);
    return (await this.findById(entity.id)) as UserEntity;
  }

  async delete(user: UserEntity): Promise<void> {
    await this.orm.delete(user.id);
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
    const entity = await this.orm.findOne({ where: { id: user.id }, relations: { roles: { permissions: true }, settings: true, permissionsRelation: true } });
    if (!entity) return user;
    entity.permissionsRelation = permissionEntities;
    await this.orm.save(entity);
    return (await this.findById(user.id)) as UserEntity;
  }

  private async prepareData(data: Partial<UserEntity>): Promise<Partial<UserOrmEntity>> {
    const { roles, permissionsRelation, settings: _settings, ...scalarData } = data;
    const prepared: Partial<UserOrmEntity> = { ...scalarData };

    if (roles) {
      const roleNames = roles.map((role) => role.name);
      prepared.roles = roleNames.length > 0
        ? await this.roleOrm.findBy(roleNames.map((name) => ({ name })))
        : [];
    }

    if (permissionsRelation) {
      const permissionNames = permissionsRelation.map((permission) => permission.name);
      prepared.permissionsRelation = permissionNames.length > 0
        ? await this.permissionOrm.findBy(permissionNames.map((name) => ({ name })))
        : [];
    }

    return prepared;
  }
}
