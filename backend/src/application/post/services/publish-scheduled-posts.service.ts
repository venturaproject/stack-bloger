import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { IPostRepository, POST_REPOSITORY } from '../../../domain/post/repositories/post.repository.interface';

@Injectable()
export class PublishScheduledPostsService implements OnModuleInit {
  constructor(@Inject(POST_REPOSITORY) private readonly postRepository: IPostRepository) {}

  onModuleInit() {
    void this.postRepository.publishScheduled();
    setInterval(() => void this.postRepository.publishScheduled(), 60_000).unref();
  }
}
