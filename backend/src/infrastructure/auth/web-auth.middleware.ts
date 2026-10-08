import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/user/repositories/user.repository.interface';
import { UserEntity } from '../../domain/user/entities/user.entity';

type AuthenticatedRequest = Request & { user?: UserEntity };

@Injectable()
export class WebAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const token = this.readAccessToken(req);

    if (!token) {
      next();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: number }>(token);
      const user = await this.userRepository.findById(payload.sub);

      if (user) {
        (req as AuthenticatedRequest).user = user;
      }
    } catch {
      // Ignore invalid cookies and proceed as guest.
    }

    next();
  }

  private readAccessToken(req: Request): string | null {
    const fromCookie = req.cookies?.access_token;
    if (typeof fromCookie === 'string' && fromCookie.trim() !== '') {
      return fromCookie;
    }

    const authHeader = req.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return null;
  }
}
