import { Inject, Injectable } from '@nestjs/common';
import { IPostRepository, POST_REPOSITORY } from '../../../domain/post/repositories/post.repository.interface';
import { PostNotFoundException } from '../../../domain/post/exceptions/post-not-found.exception';
import { PostEntity } from '../../../domain/post/entities/post.entity';

@Injectable()
export class GetPostBySlugUseCase {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(slug: string): Promise<PostEntity> {
    const post = await this.postRepository.findBySlug(slug);
    if (!post || post.status !== 'published') throw new PostNotFoundException(slug);
    return post;
  }
}
