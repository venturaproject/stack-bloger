import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from '../database/entities/user.orm.entity';
import { USER_REPOSITORY } from '../../domain/user/repositories/user.repository.interface';
import { UserRepository } from './user.repository';
import { UserController } from './user.controller';
import { CreateUserUseCase } from '../../application/user/use-cases/create-user.use-case';
import { UpdateUserUseCase } from '../../application/user/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../../application/user/use-cases/delete-user.use-case';
import { GetUserListUseCase } from '../../application/user/use-cases/get-user-list.use-case';
import { GetUserByIdUseCase } from '../../application/user/use-cases/get-user-by-id.use-case';
import { RoleEntity } from '../database/entities/role.entity';
import { PermissionEntity } from '../database/entities/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity, RoleEntity, PermissionEntity])],
  controllers: [UserController],
  providers: [
    UserRepository,
    { provide: USER_REPOSITORY, useClass: UserRepository },
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    GetUserListUseCase,
    GetUserByIdUseCase,
  ],
  exports: [USER_REPOSITORY],
})
export class UserModule {}
