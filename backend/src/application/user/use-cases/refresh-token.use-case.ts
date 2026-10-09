import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import {
  IUserRefreshTokenRepository,
  USER_REFRESH_TOKEN_REPOSITORY,
} from '../../../domain/user/repositories/user-refresh-token.repository.interface';
import { InvalidRefreshTokenException } from '../../../domain/user/exceptions/invalid-refresh-token.exception';

export interface RefreshedAuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'bearer';
  expiresIn: number;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IUserRefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(rawRefreshToken: string): Promise<RefreshedAuthTokens> {
    const hashedRefreshToken = createHash('sha256').update(rawRefreshToken).digest('hex');
    const refreshToken = await this.refreshTokenRepository.findByToken(hashedRefreshToken);

    if (!refreshToken) {
      throw new InvalidRefreshTokenException();
    }

    const nextRawRefreshToken = randomBytes(32).toString('hex');
    const nextHashedRefreshToken = createHash('sha256').update(nextRawRefreshToken).digest('hex');
    const refreshTtlMinutes = Number(process.env.JWT_REFRESH_TTL_MINUTES ?? 60 * 24 * 14);
    const expiresIn = Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 60 * 60);

    const rotation = await this.refreshTokenRepository.rotate(
      refreshToken.id,
      nextHashedRefreshToken,
      new Date(Date.now() + refreshTtlMinutes * 60 * 1000),
    );
    if (rotation === 'reused') {
      throw new InvalidRefreshTokenException('Refresh token already used. All sessions revoked.');
    }
    if (rotation !== 'rotated') throw new InvalidRefreshTokenException();

    return {
      accessToken: this.jwtService.sign({ sub: refreshToken.user.id }),
      refreshToken: nextRawRefreshToken,
      tokenType: 'bearer',
      expiresIn,
    };
  }
}
