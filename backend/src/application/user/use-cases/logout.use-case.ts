import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  IUserRefreshTokenRepository,
  USER_REFRESH_TOKEN_REPOSITORY,
} from '../../../domain/user/repositories/user-refresh-token.repository.interface';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(USER_REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IUserRefreshTokenRepository,
  ) {}

  async execute(rawRefreshToken: string): Promise<void> {
    const hashedRefreshToken = createHash('sha256').update(rawRefreshToken).digest('hex');
    const refreshToken = await this.refreshTokenRepository.findByToken(hashedRefreshToken);

    if (refreshToken && !refreshToken.isUsed()) {
      await this.refreshTokenRepository.markAsUsed(refreshToken);
    }
  }
}
