import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/user/repositories/user.repository.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserEntity } from '../../../domain/user/entities/user.entity';
import { Email } from '../../../domain/user/value-objects/email.vo';
import { UserRoleAssignment } from '../../../domain/user/entities/user.entity';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserEntity> {
    const email = new Email(dto.email);
    const username = dto.username ?? await this.userRepository.generateUsername(dto.name);
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.userRepository.create({
      name: dto.name,
      email: email.value,
      username,
      password: hashedPassword,
      status: dto.status ?? 'active',
      roles: (dto.roles ?? ['viewer']).map((name) => ({ name } as UserRoleAssignment)),
    });
  }
}
