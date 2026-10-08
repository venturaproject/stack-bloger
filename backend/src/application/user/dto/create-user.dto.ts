import { IsArray, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { UserStatus } from '../../../domain/user/entities/user.entity';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsIn(['active', 'inactive', 'suspended'])
  @IsOptional()
  status?: UserStatus;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];
}
