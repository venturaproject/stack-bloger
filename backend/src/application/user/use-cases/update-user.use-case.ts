import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/user/repositories/user.repository.interface';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserEntity } from '../../../domain/user/entities/user.entity';
import { UserNotFoundException } from '../../../domain/user/exceptions/user-not-found.exception';
import { UserRoleAssignment } from '../../../domain/user/entities/user.entity';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number, dto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new UserNotFoundException(id);

    const { roles, ...rest } = dto;
    const data: Partial<UserEntity> = { ...rest };
    if (roles) {
      data.roles = roles.map((name) => ({ name } as UserRoleAssignment));
    }
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const updatedUser = await this.userRepository.update(user, data);

    if (dto.permissions) {
      await this.userRepository.syncPermissions(updatedUser, dto.permissions);
    }

    return updatedUser;
  }
}
