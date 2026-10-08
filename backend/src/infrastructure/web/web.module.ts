import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { WebController } from './web.controller';
import { DashboardApiController } from './dashboard-api.controller';
import { SettingsApiController } from './settings-api.controller';
import { BrandingApiController } from './branding-api.controller';
import { RolesApiController, PermissionsApiController } from './list-api.controller';
import { UserEntity } from '../../domain/user/entities/user.entity';
import { RoleEntity } from '../database/entities/role.entity';
import { PermissionEntity } from '../database/entities/permission.entity';
import { UserSettingsEntity } from '../database/entities/user-settings.entity';
import { PostEntity } from '../../domain/post/entities/post.entity';
import { CategoryEntity } from '../../domain/post/entities/category.entity';
import { TagEntity } from '../../domain/post/entities/tag.entity';
import { UserRepository } from '../user/user.repository';
import { USER_REPOSITORY } from '../../domain/user/repositories/user.repository.interface';
import { CreateUserUseCase } from '../../application/user/use-cases/create-user.use-case';
import { UpdateUserUseCase } from '../../application/user/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../../application/user/use-cases/delete-user.use-case';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      UserEntity,
      RoleEntity,
      PermissionEntity,
      UserSettingsEntity,
      PostEntity,
      CategoryEntity,
      TagEntity,
    ]),
  ],
  controllers: [
    WebController,
    DashboardApiController,
    SettingsApiController,
    BrandingApiController,
    RolesApiController,
    PermissionsApiController,
  ],
  providers: [
    UserRepository,
    { provide: USER_REPOSITORY, useClass: UserRepository },
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
  ],
})
export class WebModule {}
