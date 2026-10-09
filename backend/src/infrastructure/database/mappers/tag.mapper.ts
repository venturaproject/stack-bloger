import { TagEntity } from '../../../domain/post/entities/tag.entity';
import { TagOrmEntity } from '../entities/tag.orm.entity';

export class TagMapper {
  static toDomain(tag: TagOrmEntity): TagEntity {
    return Object.assign(new TagEntity(), {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    });
  }
}
