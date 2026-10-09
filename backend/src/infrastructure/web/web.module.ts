import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { WebController } from './web.controller';
import { DashboardApiController } from './dashboard-api.controller';
import { SettingsApiController } from './settings-api.controller';
import { BrandingApiController } from './branding-api.controller';
import { RolesApiController, PermissionsApiController } from './list-api.controller';
import { UserOrmEntity } from '../database/entities/user.orm.entity';
import { RoleEntity } from '../database/entities/role.entity';
import { PermissionEntity } from '../database/entities/permission.entity';
import { UserSettingsEntity } from '../database/entities/user-settings.entity';
import { PostOrmEntity } from '../database/entities/post.orm.entity';
import { CategoryOrmEntity } from '../database/entities/category.orm.entity';
import { TagOrmEntity } from '../database/entities/tag.orm.entity';
import { UserRepository } from '../user/user.repository';
import { USER_REPOSITORY } from '../../domain/user/repositories/user.repository.interface';
import { CreateUserUseCase } from '../../application/user/use-cases/create-user.use-case';
import { UpdateUserUseCase } from '../../application/user/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../../application/user/use-cases/delete-user.use-case';
import { ApiClientEntity } from '../database/entities/api-client.entity';
import { ApiClientsController, ApiClientTokenController } from './api-clients.controller';
import { ApiResourcesController } from './api-resources.controller';
import { ApiClientGuard } from '../auth/guards/api-client.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { API_CLIENT_JWT_SERVICE } from '../auth/security/api-client-jwt.constants';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      UserOrmEntity,
      RoleEntity,
      PermissionEntity,
      UserSettingsEntity,
      PostOrmEntity,
      CategoryOrmEntity,
      TagOrmEntity,
      ApiClientEntity,
    ]),
  ],
  controllers: [
    WebController,
    DashboardApiController,
    SettingsApiController,
    BrandingApiController,
    RolesApiController,
    PermissionsApiController,
    ApiClientsController,
    ApiClientTokenController,
    ApiResourcesController,
  ],
  providers: [
    UserRepository,
    { provide: USER_REPOSITORY, useClass: UserRepository },
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    ApiClientGuard,
    {
      provide: API_CLIENT_JWT_SERVICE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('API_CLIENT_JWT_SECRET')
          ?? createHmac('sha256', config.getOrThrow<string>('JWT_SECRET')).update('api-client-token-signing:v1').digest('hex');
        return new JwtService({ secret, signOptions: { algorithm: 'HS256' } });
      },
    },
  ],
})
export class WebModule {}
