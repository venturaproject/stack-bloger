import { UserEntity } from './user.entity';

export class UserRefreshTokenEntity {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  user: UserEntity;

  isUsed(): boolean {
    return this.usedAt !== null;
  }
}
