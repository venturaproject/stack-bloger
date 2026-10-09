import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { IUserRefreshTokenRepository, RefreshTokenRotationResult } from '../../domain/user/repositories/user-refresh-token.repository.interface';
import { UserRefreshTokenEntity } from '../database/entities/user-refresh-token.entity';

@Injectable()
export class RefreshTokenRepository implements IUserRefreshTokenRepository {
  constructor(
    @InjectRepository(UserRefreshTokenEntity)
    private readonly orm: Repository<UserRefreshTokenEntity>,
  ) {}

  async create(userId: number, token: string, expiresAt: Date): Promise<UserRefreshTokenEntity> {
    const refreshToken = this.orm.create({
      userId,
      token,
      expiresAt,
      usedAt: null,
    });

    return this.orm.save(refreshToken);
  }

  findByToken(token: string): Promise<UserRefreshTokenEntity | null> {
    return this.orm.findOne({
      where: { token },
      relations: { user: { roles: true, settings: true } },
    });
  }

  async markAsUsed(refreshToken: UserRefreshTokenEntity): Promise<UserRefreshTokenEntity> {
    refreshToken.usedAt = new Date();
    return this.orm.save(refreshToken);
  }

  async rotate(refreshTokenId: number, nextToken: string, expiresAt: Date): Promise<RefreshTokenRotationResult> {
    return this.orm.manager.transaction(async (manager) => {
      const repository = manager.getRepository(UserRefreshTokenEntity);
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
}
