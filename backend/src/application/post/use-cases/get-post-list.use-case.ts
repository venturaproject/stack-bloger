import { Inject, Injectable } from '@nestjs/common';
import {
  IPostRepository,
  POST_REPOSITORY,
  PaginatedResult,
  PostFilters,
} from '../../../domain/post/repositories/post.repository.interface';
import { PostEntity } from '../../../domain/post/entities/post.entity';

@Injectable()
export class GetPostListUseCase {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(filters: PostFilters): Promise<PaginatedResult<PostEntity>> {
    return this.postRepository.getPaginated(filters);
  }
}
