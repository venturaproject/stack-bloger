import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { PublishScheduledPostsCommand } from '../commands/post.commands';

@Injectable()
export class PublishScheduledPostsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PublishScheduledPostsService.name);

  constructor(private readonly commandBus: CommandBus) {}

  onApplicationBootstrap() {
    void this.publishScheduledPosts();
    setInterval(() => void this.publishScheduledPosts(), 60_000).unref();
  }

  private async publishScheduledPosts() {
    try {
      await this.commandBus.execute(new PublishScheduledPostsCommand());
    } catch (error) {
      this.logger.error('Failed to publish scheduled posts', error);
    }
  }
}
