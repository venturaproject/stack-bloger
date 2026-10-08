import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { IUserRepository, USER_REPOSITORY } from '../../domain/user/repositories/user.repository.interface';
import { Request } from 'express';

function extractJwtFromCookie(req: Request): string | null {
  const token = req.cookies?.access_token;
  return typeof token === 'string' && token.trim() !== '' ? token : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractJwtFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      // getOrThrow: startup fails immediately if JWT_SECRET is not set,
      // preventing the 'secret' default from silently weakening production.
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
      issuer: config.get<string>('JWT_ISSUER', 'boilerplate-api'),
    });
  }

  async validate(payload: { sub: number }) {
    const user = await this.userRepository.findById(payload.sub);

    if (!user || !user.isActive()) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
