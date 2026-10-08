import { PostEntity, PostStatus } from '../entities/post.entity';

export interface PostFilters {
  search?: string;
  status?: PostStatus;
  categorySlug?: string;
  tagSlug?: string;
  order?: 'newest' | 'oldest' | 'popular';
  authorId?: number;
  page?: number;
  perPage?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
}

export interface PostStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
}

export const POST_REPOSITORY = Symbol('POST_REPOSITORY');

export interface IPostRepository {
  findById(id: number): Promise<PostEntity | null>;
  findBySlug(slug: string): Promise<PostEntity | null>;
  getPaginated(filters: PostFilters): Promise<PaginatedResult<PostEntity>>;
  create(data: Partial<PostEntity>): Promise<PostEntity>;
  update(post: PostEntity, data: Partial<PostEntity>): Promise<PostEntity>;
  delete(post: PostEntity): Promise<void>;
  generateSlug(title: string): Promise<string>;
  getStats(): Promise<PostStats>;
  syncCategories(post: PostEntity, categoryIds: number[]): Promise<PostEntity>;
  syncTags(post: PostEntity, tagIds: number[]): Promise<PostEntity>;
  findRelated(postId: number, categoryIds: number[], limit: number): Promise<PostEntity[]>;
  incrementViews(id: number): Promise<void>;
  publishScheduled(): Promise<void>;
}
