import { UserEntity } from '../../user/entities/user.entity';
import { CategoryEntity } from './category.entity';
import { TagEntity } from './tag.entity';

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export class PostEntity {
  id: number;

  title: string;

  slug: string;

  content: string;

  excerpt: string | null;

  featuredImage: string | null;

  status: PostStatus;

  publishedAt: Date | null;

  viewCount: number;

  authorId: number;

  author: UserEntity | null;

  categories: CategoryEntity[];

  tags: TagEntity[];

  createdAt: Date;

  updatedAt: Date;
}
