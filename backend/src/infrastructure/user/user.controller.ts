import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CreateUserUseCase } from '../../application/user/use-cases/create-user.use-case';
import { UpdateUserUseCase } from '../../application/user/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../../application/user/use-cases/delete-user.use-case';
import { GetUserListUseCase } from '../../application/user/use-cases/get-user-list.use-case';
import { GetUserByIdUseCase } from '../../application/user/use-cases/get-user-by-id.use-case';
import { CreateUserDto } from '../../application/user/dto/create-user.dto';
import { UpdateUserDto } from '../../application/user/dto/update-user.dto';
import { UserFiltersDto } from '../../application/user/dto/user-filters.dto';
import { UserRepository } from './user.repository';
import { UserResource } from './resources/user.resource';

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(
    private readonly getUserList: GetUserListUseCase,
    private readonly getUserById: GetUserByIdUseCase,
    private readonly createUser: CreateUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly deleteUser: DeleteUserUseCase,
    private readonly userRepository: UserRepository,
  ) {}

  @Get()
  @Roles('admin', 'editor')
  async index(@Query() filters: UserFiltersDto) {
    const result = await this.getUserList.execute(filters);
    return {
      data: UserResource.collection(result.data),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        lastPage: result.lastPage,
      },
      stats: await this.userRepository.getStats(),
    };
  }

  @Get(':id')
  @Roles('admin', 'editor')
  async show(@Param('id', ParseIntPipe) id: number) {
    const user = await this.getUserById.execute(id);
    return {
      data: UserResource.from(user),
      userPermissions: user.directPermissions,
      effectivePermissions: user.permissions,
      hasFullAccess: user.roleNames.includes('admin'),
      userRoles: user.roleNames,
    };
  }

  @Post()
  @Roles('admin')
  async store(@Body() dto: CreateUserDto) {
    const user = await this.createUser.execute(dto);
    return { data: UserResource.from(user) };
  }

  @Put(':id')
  @Roles('admin')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    const user = await this.updateUser.execute(id, dto);
    return { data: UserResource.from(user) };
  }

  @Delete(':id')
  @Roles('admin')
  async destroy(@Param('id', ParseIntPipe) id: number) {
    await this.deleteUser.execute(id);
    return { message: 'User deleted successfully' };
  }
}
