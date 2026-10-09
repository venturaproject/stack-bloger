import { PostEntity } from '../../../domain/post/entities/post.entity';
import { PostOrmEntity } from '../entities/post.orm.entity';
import { UserMapper } from './user.mapper';
import { CategoryMapper } from './category.mapper';
import { TagMapper } from './tag.mapper';

export class PostMapper {
  static toDomain(post: PostOrmEntity): PostEntity {
    return Object.assign(new PostEntity(), {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      status: post.status,
      publishedAt: post.publishedAt,
      viewCount: post.viewCount,
      authorId: post.authorId,
      author: post.author ? UserMapper.toDomain(post.author) : null,
      categories: (post.categories ?? []).map(CategoryMapper.toDomain),
      tags: (post.tags ?? []).map(TagMapper.toDomain),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    });
  }

  static toPersistence(post: Partial<PostEntity>): Partial<PostOrmEntity> {
    const fields = ['id', 'title', 'slug', 'content', 'excerpt', 'featuredImage', 'status', 'publishedAt', 'viewCount', 'authorId'] as const;
    return Object.fromEntries(fields
      .filter((field) => post[field] !== undefined)
      .map((field) => [field, post[field]])) as Partial<PostOrmEntity>;
  }
}
