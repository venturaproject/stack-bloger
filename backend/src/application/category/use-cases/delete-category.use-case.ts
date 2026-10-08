import { Inject, Injectable } from '@nestjs/common';
import { CATEGORY_REPOSITORY, ICategoryRepository } from '../../../domain/post/repositories/category.repository.interface';
import { CategoryNotFoundException } from '../../../domain/post/exceptions/category-not-found.exception';

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new CategoryNotFoundException(id);
    await this.categoryRepository.delete(category);
  }
}
