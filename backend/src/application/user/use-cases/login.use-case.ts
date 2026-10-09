import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/user/repositories/user.repository.interface';
import {
  IUserRefreshTokenRepository,
  USER_REFRESH_TOKEN_REPOSITORY,
} from '../../../domain/user/repositories/user-refresh-token.repository.interface';
import { LoginDto } from '../dto/login.dto';
import { InvalidCredentialsException } from '../../../domain/user/exceptions/invalid-credentials.exception';
import { randomBytes, createHash } from 'crypto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'bearer';
  expiresIn: number;
  user: {
    id: number;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
    avatar: string | null;
  };
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(USER_REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: IUserRefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthTokens> {
    const user =
      (await this.userRepository.findByEmail(dto.login)) ??
      (await this.userRepository.findByUsername(dto.login));

    if (!user) throw new InvalidCredentialsException();

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new InvalidCredentialsException();

    if (!user.isActive()) throw new InvalidCredentialsException();

    const payload = { sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = randomBytes(32).toString('hex');
    const hashedRefreshToken = createHash('sha256').update(refreshToken).digest('hex');
    const refreshTtlMinutes = Number(process.env.JWT_REFRESH_TTL_MINUTES ?? 60 * 24 * 14);
    const expiresIn = Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 60 * 60);

    await this.refreshTokenRepository.create(
      user.id,
      hashedRefreshToken,
      new Date(Date.now() + refreshTtlMinutes * 60 * 1000),
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'bearer',
      expiresIn,
      user: {
        id: user.id,
        name: user.name,
          email: user.email,
          roles: user.roleNames,
          permissions: user.permissions,
          avatar: user.settings?.avatar ?? null,
      },
    };
  }
}
