import { UserRefreshTokenEntity } from '../../../infrastructure/database/entities/user-refresh-token.entity';

export const USER_REFRESH_TOKEN_REPOSITORY = Symbol('USER_REFRESH_TOKEN_REPOSITORY');

export interface IUserRefreshTokenRepository {
  create(userId: number, token: string, expiresAt: Date): Promise<UserRefreshTokenEntity>;
  findByToken(token: string): Promise<UserRefreshTokenEntity | null>;
  markAsUsed(refreshToken: UserRefreshTokenEntity): Promise<UserRefreshTokenEntity>;
  revokeAllForUser(userId: number): Promise<void>;
}
