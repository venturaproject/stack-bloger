import { CategoryEntity } from '../../../domain/post/entities/category.entity';
import { CategoryOrmEntity } from '../entities/category.orm.entity';

export class CategoryMapper {
  static toDomain(category: CategoryOrmEntity): CategoryEntity {
    return Object.assign(new CategoryEntity(), {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    });
  }
}
