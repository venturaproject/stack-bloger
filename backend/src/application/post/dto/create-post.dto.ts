import { IsString, IsNotEmpty, IsOptional, IsArray, IsIn, IsNumber, MaxLength, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from '../../../domain/post/entities/post.entity';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  slug?: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsString()
  @IsOptional()
  featuredImage?: string;

  @IsIn(['draft', 'scheduled', 'published', 'archived'])
  @IsOptional()
  status?: PostStatus;

  @IsDateString()
  @IsOptional()
  publishedAt?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @IsOptional()
  categoryIds?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @IsOptional()
  tagIds?: number[];
}
