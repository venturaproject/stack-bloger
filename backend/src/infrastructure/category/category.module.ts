import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from '../../domain/post/entities/category.entity';
import { CATEGORY_REPOSITORY } from '../../domain/post/repositories/category.repository.interface';
import { CategoryRepository } from './category.repository';
import { CategoryController, PublicCategoryController } from './category.controller';
import { CreateCategoryUseCase } from '../../application/category/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from '../../application/category/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from '../../application/category/use-cases/delete-category.use-case';
import { GetCategoryListUseCase } from '../../application/category/use-cases/get-category-list.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity])],
  controllers: [CategoryController, PublicCategoryController],
  providers: [
    CategoryRepository,
    { provide: CATEGORY_REPOSITORY, useClass: CategoryRepository },
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    GetCategoryListUseCase,
  ],
  exports: [CATEGORY_REPOSITORY, GetCategoryListUseCase],
})
export class CategoryModule {}
