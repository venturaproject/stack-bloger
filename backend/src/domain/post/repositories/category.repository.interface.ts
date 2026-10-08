import { CategoryEntity } from '../entities/category.entity';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface ICategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface ICategoryRepository {
  findAll(): Promise<CategoryEntity[]>;
  findById(id: number): Promise<CategoryEntity | null>;
  findBySlug(slug: string): Promise<CategoryEntity | null>;
  create(data: Partial<CategoryEntity>): Promise<CategoryEntity>;
  update(category: CategoryEntity, data: Partial<CategoryEntity>): Promise<CategoryEntity>;
  delete(category: CategoryEntity): Promise<void>;
  generateSlug(name: string): Promise<string>;
}
