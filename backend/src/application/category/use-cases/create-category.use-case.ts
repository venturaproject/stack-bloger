import { Inject, Injectable } from '@nestjs/common';
import { CATEGORY_REPOSITORY, ICategoryRepository } from '../../../domain/post/repositories/category.repository.interface';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CategoryEntity } from '../../../domain/post/entities/category.entity';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(dto: CreateCategoryDto): Promise<CategoryEntity> {
    const slug = dto.slug ?? await this.categoryRepository.generateSlug(dto.name);
    return this.categoryRepository.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
    });
  }
}
