import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { UserStatus } from '../../../domain/user/entities/user.entity';

export class UserFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsIn(['active', 'inactive', 'suspended'])
  @IsOptional()
  status?: UserStatus;

  @IsString()
  @IsOptional()
  role?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Transform(({ value }) => {
    const n = Number(value);
    return [10, 20, 50, 100].includes(n) ? n : 20;
  })
  @IsInt()
  @IsOptional()
  perPage?: number = 20;
}
