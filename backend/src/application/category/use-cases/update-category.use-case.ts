import { Inject, Injectable } from '@nestjs/common';
import { CATEGORY_REPOSITORY, ICategoryRepository } from '../../../domain/post/repositories/category.repository.interface';
import { CategoryNotFoundException } from '../../../domain/post/exceptions/category-not-found.exception';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryEntity } from '../../../domain/post/entities/category.entity';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(id: number, dto: UpdateCategoryDto): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new CategoryNotFoundException(id);

    const updates: Partial<CategoryEntity> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.slug !== undefined) updates.slug = dto.slug;
    if (dto.description !== undefined) updates.description = dto.description ?? null;

    return this.categoryRepository.update(category, updates);
  }
}
