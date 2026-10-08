import { IsString, IsOptional, IsIn, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from '../../../domain/post/entities/post.entity';

export class PostFiltersDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsIn(['draft', 'scheduled', 'published', 'archived'])
  @IsOptional()
  status?: PostStatus;

  @IsString()
  @IsOptional()
  categorySlug?: string;

  @IsString()
  @IsOptional()
  tagSlug?: string;

  @IsIn(['newest', 'oldest', 'popular'])
  @IsOptional()
  order?: 'newest' | 'oldest' | 'popular';

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  perPage?: number;
}
