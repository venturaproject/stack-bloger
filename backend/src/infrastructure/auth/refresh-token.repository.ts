import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { IUserRefreshTokenRepository, RefreshTokenRotationResult } from '../../domain/user/repositories/user-refresh-token.repository.interface';
import { UserRefreshTokenEntity as UserRefreshToken } from '../../domain/user/entities/user-refresh-token.entity';
import { UserRefreshTokenEntity as UserRefreshTokenOrmEntity } from '../database/entities/user-refresh-token.entity';
import { UserMapper } from '../database/mappers/user.mapper';

@Injectable()
export class RefreshTokenRepository implements IUserRefreshTokenRepository {
  constructor(
    @InjectRepository(UserRefreshTokenOrmEntity)
    private readonly orm: Repository<UserRefreshTokenOrmEntity>,
  ) {}

  async create(userId: number, token: string, expiresAt: Date): Promise<UserRefreshToken> {
    const refreshToken = this.orm.create({
      userId,
      token,
      expiresAt,
      usedAt: null,
    });

    return this.toDomain(await this.orm.save(refreshToken));
  }

  async findByToken(token: string): Promise<UserRefreshToken | null> {
    const refreshToken = await this.orm.findOne({
      where: { token },
      relations: { user: { roles: true, settings: true } },
    });
    return refreshToken ? this.toDomain(refreshToken) : null;
  }

  async markAsUsed(refreshToken: UserRefreshToken): Promise<UserRefreshToken> {
    await this.orm.update({ id: refreshToken.id }, { usedAt: new Date() });
    const current = await this.orm.findOneOrFail({
      where: { id: refreshToken.id },
      relations: { user: { roles: true, settings: true } },
    });
    return this.toDomain(current);
  }

  async rotate(refreshTokenId: number, nextToken: string, expiresAt: Date): Promise<RefreshTokenRotationResult> {
    return this.orm.manager.transaction(async (manager) => {
      const repository = manager.getRepository(UserRefreshTokenOrmEntity);
      const current = await repository.findOne({
        where: { id: refreshTokenId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!current || current.expiresAt.getTime() <= Date.now()) return 'invalid';

      if (current.usedAt) {
        await repository.update({ userId: current.userId, usedAt: IsNull() }, { usedAt: new Date() });
        return 'reused';
      }

      current.usedAt = new Date();
      await repository.save(current);
      await repository.save(repository.create({ userId: current.userId, token: nextToken, expiresAt, usedAt: null }));
      return 'rotated';
    });
  }

  async revokeAllForUser(userId: number): Promise<void> {
    await this.orm.update(
      { userId, usedAt: IsNull() },
      { usedAt: new Date() },
    );
  }

  private toDomain(refreshToken: UserRefreshTokenOrmEntity): UserRefreshToken {
    return Object.assign(new UserRefreshToken(), {
      id: refreshToken.id,
      userId: refreshToken.userId,
      token: refreshToken.token,
      expiresAt: refreshToken.expiresAt,
      usedAt: refreshToken.usedAt,
      user: UserMapper.toDomain(refreshToken.user),
    });
  }
}
