import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PostEntity } from '../../../domain/post/entities/post.entity';
import { PostNotFoundException } from '../../../domain/post/exceptions/post-not-found.exception';
import {
  IPostRepository,
  POST_REPOSITORY,
  PaginatedResult,
  PostStats,
} from '../../../domain/post/repositories/post.repository.interface';
import { GetPostByIdQuery, GetPostBySlugQuery, GetPostListQuery, GetPostStatsQuery, GetRelatedPostsQuery } from '../queries/post.queries';

@QueryHandler(GetPostListQuery)
export class GetPostListHandler implements IQueryHandler<GetPostListQuery, PaginatedResult<PostEntity>> {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: IPostRepository) {}

  execute({ filters }: GetPostListQuery): Promise<PaginatedResult<PostEntity>> {
    return this.posts.getPaginated(filters);
  }
}

@QueryHandler(GetPostByIdQuery)
export class GetPostByIdHandler implements IQueryHandler<GetPostByIdQuery, PostEntity> {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: IPostRepository) {}

  async execute({ id }: GetPostByIdQuery): Promise<PostEntity> {
    const post = await this.posts.findById(id);
    if (!post) throw new PostNotFoundException(id);
    return post;
  }
}

@QueryHandler(GetPostBySlugQuery)
export class GetPostBySlugHandler implements IQueryHandler<GetPostBySlugQuery, PostEntity> {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: IPostRepository) {}

  async execute({ slug }: GetPostBySlugQuery): Promise<PostEntity> {
    const post = await this.posts.findBySlug(slug);
    if (!post || post.status !== 'published') throw new PostNotFoundException(slug);
    return post;
  }
}

@QueryHandler(GetRelatedPostsQuery)
export class GetRelatedPostsHandler implements IQueryHandler<GetRelatedPostsQuery, PostEntity[]> {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: IPostRepository) {}

  async execute({ slug, limit }: GetRelatedPostsQuery): Promise<PostEntity[]> {
    const post = await this.posts.findBySlug(slug);
    if (!post || post.status !== 'published') throw new PostNotFoundException(slug);
    return this.posts.findRelated(post.id, (post.categories ?? []).map((category) => category.id), limit);
  }
}

@QueryHandler(GetPostStatsQuery)
export class GetPostStatsHandler implements IQueryHandler<GetPostStatsQuery, PostStats> {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: IPostRepository) {}

  execute(): Promise<PostStats> {
    return this.posts.getStats();
  }
}
