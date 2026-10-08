import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { LoginUseCase } from '../../application/user/use-cases/login.use-case';
import { LoginDto } from '../../application/user/dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { RefreshTokenUseCase } from '../../application/user/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/user/use-cases/logout.use-case';
import { GetCurrentUserProfileUseCase } from '../../application/user/use-cases/get-current-user-profile.use-case';
import { UserEntity } from '../../domain/user/entities/user.entity';

@Controller('api/v1/auth')
@Throttle({ short: { ttl: 60000, limit: 5 } })
export class AuthController {
  private readonly refreshTtlMs: number

  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getCurrentUserProfile: GetCurrentUserProfileUseCase,
    config: ConfigService,
  ) {
    this.refreshTtlMs = config.get<number>('JWT_REFRESH_TTL_MINUTES', 20160) * 60 * 1000
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.loginUseCase.execute(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken, result.expiresIn);
    // Do not expose tokens in the body — the browser handles them via httpOnly cookies.
    return {
      tokenType: result.tokenType,
      expiresIn:  result.expiresIn,
      user:       result.user,
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = req.cookies?.refresh_token as string | undefined;
    if (!rawRefreshToken) throw new UnauthorizedException('No refresh token cookie');
    const result = await this.refreshTokenUseCase.execute(rawRefreshToken);
    this.setAuthCookies(res, result.accessToken, result.refreshToken, result.expiresIn);
    return { expiresIn: result.expiresIn };
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = req.cookies?.refresh_token as string | undefined;
    if (rawRefreshToken) {
      try { await this.logoutUseCase.execute(rawRefreshToken); } catch {}
    }
    this.clearAuthCookies(res);
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: UserEntity) {
    return { data: this.getCurrentUserProfile.execute(user) };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string, expiresIn: number) {
    const secure = process.env.NODE_ENV === 'production';
    const base = { httpOnly: true, secure, sameSite: 'lax' as const };
    res.cookie('access_token', accessToken, { ...base, maxAge: expiresIn * 1000, path: '/' });
    res.cookie('refresh_token', refreshToken, { ...base, maxAge: this.refreshTtlMs, path: '/api/v1/auth' });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('access_token',  { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/v1/auth' });
  }
}
