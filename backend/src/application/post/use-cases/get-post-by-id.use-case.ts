import { Inject, Injectable } from '@nestjs/common';
import { IPostRepository, POST_REPOSITORY } from '../../../domain/post/repositories/post.repository.interface';
import { PostNotFoundException } from '../../../domain/post/exceptions/post-not-found.exception';
import { PostEntity } from '../../../domain/post/entities/post.entity';

@Injectable()
export class GetPostByIdUseCase {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(id: number): Promise<PostEntity> {
    const post = await this.postRepository.findById(id);
    if (!post) throw new PostNotFoundException(id);
    return post;
  }
}
