import { Inject, Injectable } from '@nestjs/common';
import { CATEGORY_REPOSITORY, ICategoryRepository } from '../../../domain/post/repositories/category.repository.interface';
import { CategoryEntity } from '../../../domain/post/entities/category.entity';

@Injectable()
export class GetCategoryListUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(): Promise<CategoryEntity[]> {
    return this.categoryRepository.findAll();
  }
}
