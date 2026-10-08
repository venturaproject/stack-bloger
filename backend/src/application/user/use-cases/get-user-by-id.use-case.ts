import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/user/repositories/user.repository.interface';
import { UserEntity } from '../../../domain/user/entities/user.entity';
import { UserNotFoundException } from '../../../domain/user/exceptions/user-not-found.exception';

@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new UserNotFoundException(id);
    return user;
  }
}
