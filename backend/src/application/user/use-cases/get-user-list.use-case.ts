import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, PaginatedResult, USER_REPOSITORY } from '../../../domain/user/repositories/user.repository.interface';
import { UserFiltersDto } from '../dto/user-filters.dto';
import { UserEntity } from '../../../domain/user/entities/user.entity';

@Injectable()
export class GetUserListUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(filters: UserFiltersDto): Promise<PaginatedResult<UserEntity>> {
    return this.userRepository.getPaginated(filters);
  }
}
