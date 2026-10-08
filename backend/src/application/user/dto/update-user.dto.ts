import { IsArray, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { UserStatus } from '../../../domain/user/entities/user.entity';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}
