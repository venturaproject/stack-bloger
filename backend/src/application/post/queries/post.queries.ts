import { Query } from '@nestjs/cqrs';
import { PostEntity } from '../../../domain/post/entities/post.entity';
import { PaginatedResult, PostFilters, PostStats } from '../../../domain/post/repositories/post.repository.interface';

export class GetPostListQuery extends Query<PaginatedResult<PostEntity>> {
  constructor(readonly filters: PostFilters) { super(); }
}

export class GetPostByIdQuery extends Query<PostEntity> {
  constructor(readonly id: number) { super(); }
}

export class GetPostBySlugQuery extends Query<PostEntity> {
  constructor(readonly slug: string) { super(); }
}

export class GetRelatedPostsQuery extends Query<PostEntity[]> {
  constructor(readonly slug: string, readonly limit = 3) { super(); }
}

export class GetPostStatsQuery extends Query<PostStats> {
  constructor() { super(); }
}
