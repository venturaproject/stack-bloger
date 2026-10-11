import { Command } from '@nestjs/cqrs';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostEntity } from '../../../domain/post/entities/post.entity';

export class CreatePostCommand extends Command<PostEntity> {
  constructor(readonly dto: CreatePostDto, readonly authorId: number) { super(); }
}

export class UpdatePostCommand extends Command<PostEntity> {
  constructor(readonly id: number, readonly dto: UpdatePostDto) { super(); }
}

export class DeletePostCommand extends Command<void> {
  constructor(readonly id: number) { super(); }
}

export class IncrementPostViewsCommand extends Command<void> {
  constructor(readonly id: number) { super(); }
}

export class PublishScheduledPostsCommand extends Command<void> {
  constructor() { super(); }
}
