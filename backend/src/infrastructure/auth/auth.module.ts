import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../domain/user/entities/user.entity';
import { USER_REPOSITORY } from '../../domain/user/repositories/user.repository.interface';
import {
  USER_REFRESH_TOKEN_REPOSITORY,
} from '../../domain/user/repositories/user-refresh-token.repository.interface';
import { UserRepository } from '../user/user.repository';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { LoginUseCase } from '../../application/user/use-cases/login.use-case';
import { UserRefreshTokenEntity } from '../database/entities/user-refresh-token.entity';
import { RefreshTokenRepository } from './refresh-token.repository';
import { RefreshTokenUseCase } from '../../application/user/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/user/use-cases/logout.use-case';
import { GetCurrentUserProfileUseCase } from '../../application/user/use-cases/get-current-user-profile.use-case';
import { RoleEntity } from '../database/entities/role.entity';
import { PermissionEntity } from '../database/entities/permission.entity';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          algorithm:  'HS256',
          expiresIn:  Number(config.get('JWT_EXPIRES_IN_SECONDS', '3600')),
          issuer:     config.get<string>('JWT_ISSUER', 'boilerplate-api'),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([UserEntity, RoleEntity, PermissionEntity, UserRefreshTokenEntity]),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    GetCurrentUserProfileUseCase,
    RefreshTokenRepository,
    UserRepository,
    { provide: USER_REPOSITORY, useClass: UserRepository },
    { provide: USER_REFRESH_TOKEN_REPOSITORY, useClass: RefreshTokenRepository },
  ],
  exports: [JwtModule, LoginUseCase, LogoutUseCase, RefreshTokenUseCase],
})
export class AuthModule {}
