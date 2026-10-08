import {
  Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe,
  Post, Put, Query, UnprocessableEntityException, UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleEntity } from '../database/entities/role.entity';
import { PermissionEntity } from '../database/entities/permission.entity';

function normalizePage(raw?: string): number {
  const n = parseInt(raw ?? '1', 10);
  return isNaN(n) || n < 1 ? 1 : n;
}

function normalizePerPage(raw?: string, def = 20): number {
  const n = parseInt(raw ?? String(def), 10);
  return isNaN(n) || n < 1 ? def : Math.min(n, 200);
}

// ── Roles ─────────────────────────────────────────────────────────────────────

@Controller('api/v1/roles')
@UseGuards(JwtAuthGuard)
export class RolesApiController {
  constructor(
    @InjectRepository(RoleEntity) private readonly repo: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity) private readonly permRepo: Repository<PermissionEntity>,
  ) {}

  @Get()
  async index(
    @Query('search') search?: string,
    @Query('page') pageRaw?: string,
    @Query('per_page') perPageRaw?: string,
  ) {
    const page = normalizePage(pageRaw);
    const perPage = normalizePerPage(perPageRaw);

    const qb = this.repo
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .leftJoinAndSelect('role.users', 'user');

    if (search) qb.andWhere('role.name ILIKE :search', { search: `%${search}%` });

    const [roles, total] = await qb
      .orderBy('role.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    return {
      roles: {
        data: roles.map((r) => ({
          id: r.id,
          name: r.name,
          guard_name: r.guardName,
          permissions: r.permissions.map((p) => ({ id: p.id, name: p.name })),
          users_count: r.users?.length ?? 0,
          created_at: r.createdAt.toISOString(),
          updated_at: r.updatedAt.toISOString(),
        })),
        meta: { current_page: page, last_page: Math.max(1, Math.ceil(total / perPage)), per_page: perPage, total },
      },
      filters: { search },
    };
  }

  @Get('create')
  async create() {
    const permissions = await this.permRepo.find({ order: { name: 'ASC' } });
    const grouped = this.groupPermissions(permissions);
    return { permissions: permissions.map((p) => ({ id: p.id, name: p.name })), grouped };
  }

  @Post()
  async store(@Body() body: { name: string; permissions?: string[] }) {
    if (!body.name?.trim()) throw new UnprocessableEntityException({ name: 'El nombre es obligatorio.' });
    const existing = await this.repo.findOne({ where: { name: body.name.trim() } });
    if (existing) throw new UnprocessableEntityException({ name: 'Ese rol ya existe.' });
    const permissionEntities = body.permissions?.length
      ? await this.permRepo.findBy(body.permissions.map((p) => ({ name: p })))
      : [];
    const role = this.repo.create({ name: body.name.trim(), guardName: 'web', permissions: permissionEntities });
    await this.repo.save(role);
    return { id: role.id, name: role.name, permissions: role.permissions.map((p) => ({ id: p.id, name: p.name })) };
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: { name: string; permissions?: string[] }) {
    const role = await this.repo.findOne({ where: { id }, relations: { permissions: true } });
    if (!role) throw new NotFoundException();
    if (!body.name?.trim()) throw new UnprocessableEntityException({ name: 'El nombre es obligatorio.' });
    const duplicate = await this.repo.findOne({ where: { name: body.name.trim() } });
    if (duplicate && duplicate.id !== id) throw new UnprocessableEntityException({ name: 'Ese rol ya existe.' });
    role.name = body.name.trim();
    role.permissions = body.permissions?.length
      ? await this.permRepo.findBy(body.permissions.map((p) => ({ name: p })))
      : [];
    await this.repo.save(role);
    return { id: role.id, name: role.name, permissions: role.permissions.map((p) => ({ id: p.id, name: p.name })) };
  }

  @Delete(':id')
  async destroy(@Param('id', ParseIntPipe) id: number) {
    const role = await this.repo.findOne({ where: { id } });
    if (!role) throw new NotFoundException();
    await this.repo.remove(role);
    return { success: true };
  }

  private groupPermissions(permissions: PermissionEntity[]) {
    const groups: Record<string, {
      key: string;
      label: string;
      permissions: Array<{ name: string; action: string; actionLabel: string }>;
    }> = {};
    for (const p of permissions) {
      const [resource, action] = p.name.split('.');
      if (!resource) continue;
      if (!groups[resource]) groups[resource] = { key: resource, label: resource, permissions: [] };
      groups[resource].permissions.push({ name: p.name, action: action ?? p.name, actionLabel: action ?? p.name });
    }
    return Object.values(groups);
  }
}

// ── Permissions ───────────────────────────────────────────────────────────────

@Controller('api/v1/permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsApiController {
  constructor(@InjectRepository(PermissionEntity) private readonly repo: Repository<PermissionEntity>) {}

  @Get()
  async index(
    @Query('search') search?: string,
    @Query('group') group?: string,
    @Query('page') pageRaw?: string,
    @Query('per_page') perPageRaw?: string,
  ) {
    const page = normalizePage(pageRaw);
    const perPage = normalizePerPage(perPageRaw);

    const qb = this.repo.createQueryBuilder('p').leftJoinAndSelect('p.roles', 'role');

    if (search) qb.andWhere('p.name ILIKE :search', { search: `%${search}%` });
    if (group) qb.andWhere('p.name ILIKE :group', { group: `${group}.%` });

    const [permissions, total] = await qb
      .orderBy('p.name', 'ASC')
      .skip((page - 1) * perPage)
      .take(perPage)
      .getManyAndCount();

    const allGroups = await this.repo
      .createQueryBuilder('p')
      .select("SPLIT_PART(p.name, '.', 1)", 'grp')
      .where("p.name LIKE '%.%'")
      .groupBy("SPLIT_PART(p.name, '.', 1)")
      .orderBy("SPLIT_PART(p.name, '.', 1)", 'ASC')
      .getRawMany<{ grp: string }>();

    return {
      permissions: {
        data: permissions.map((p) => ({
          id: p.id,
          name: p.name,
          guard_name: p.guardName,
          roles_count: p.roles?.length ?? 0,
          created_at: p.createdAt.toISOString(),
          updated_at: p.updatedAt.toISOString(),
        })),
        meta: { current_page: page, last_page: Math.max(1, Math.ceil(total / perPage)), per_page: perPage, total },
      },
      groups: allGroups.map((r) => r.grp),
      filters: { search, group },
    };
  }

  @Post()
  async store(@Body() body: { name: string }) {
    if (!body.name?.trim()) throw new UnprocessableEntityException({ name: 'El nombre es obligatorio.' });
    const existing = await this.repo.findOne({ where: { name: body.name.trim() } });
    if (existing) throw new UnprocessableEntityException({ name: 'Ese permiso ya existe.' });
    const perm = this.repo.create({ name: body.name.trim(), guardName: 'web' });
    await this.repo.save(perm);
    return { id: perm.id, name: perm.name };
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: { name: string }) {
    const perm = await this.repo.findOne({ where: { id } });
    if (!perm) throw new NotFoundException();
    if (!body.name?.trim()) throw new UnprocessableEntityException({ name: 'El nombre es obligatorio.' });
    const duplicate = await this.repo.findOne({ where: { name: body.name.trim() } });
    if (duplicate && duplicate.id !== id) throw new UnprocessableEntityException({ name: 'Ese permiso ya existe.' });
    perm.name = body.name.trim();
    await this.repo.save(perm);
    return { id: perm.id, name: perm.name };
  }

  @Delete(':id')
  async destroy(@Param('id', ParseIntPipe) id: number) {
    const perm = await this.repo.findOne({ where: { id } });
    if (!perm) throw new NotFoundException();
    await this.repo.remove(perm);
    return { success: true };
  }
}
