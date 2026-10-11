import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IPostRepository, POST_REPOSITORY } from '../../../domain/post/repositories/post.repository.interface';
import { PostEntity } from '../../../domain/post/entities/post.entity';
import { PostNotFoundException } from '../../../domain/post/exceptions/post-not-found.exception';
import {
  CreatePostCommand,
  DeletePostCommand,
  IncrementPostViewsCommand,
  PublishScheduledPostsCommand,
  UpdatePostCommand,
} from '../commands/post.commands';

@CommandHandler(CreatePostCommand)
export class CreatePostHandler implements ICommandHandler<CreatePostCommand, PostEntity> {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: IPostRepository) {}

  async execute({ dto, authorId }: CreatePostCommand): Promise<PostEntity> {
    const slug = dto.slug ?? await this.posts.generateSlug(dto.title);
    const scheduledAt = dto.publishedAt ? new Date(dto.publishedAt) : null;
    if (dto.status === 'scheduled' && (!scheduledAt || scheduledAt <= new Date())) {
      throw new Error('Scheduled posts require a future publication date');
    }

    const post = await this.posts.create({
      title: dto.title,
      slug,
      content: dto.content,
      excerpt: dto.excerpt ?? null,
      featuredImage: dto.featuredImage ?? null,
      status: dto.status ?? 'draft',
      authorId,
      publishedAt: dto.status === 'published' ? new Date() : dto.status === 'scheduled' ? scheduledAt : null,
    });
    if (dto.categoryIds?.length) await this.posts.syncCategories(post, dto.categoryIds);
    if (dto.tagIds?.length) await this.posts.syncTags(post, dto.tagIds);
    return (await this.posts.findById(post.id)) as PostEntity;
  }
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostHandler implements ICommandHandler<UpdatePostCommand, PostEntity> {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: IPostRepository) {}

  async execute({ id, dto }: UpdatePostCommand): Promise<PostEntity> {
    const post = await this.posts.findById(id);
    if (!post) throw new PostNotFoundException(id);
    const updates: Partial<PostEntity> = {};
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.slug !== undefined) updates.slug = dto.slug;
    if (dto.content !== undefined) updates.content = dto.content;
    if (dto.excerpt !== undefined) updates.excerpt = dto.excerpt ?? null;
    if (dto.featuredImage !== undefined) updates.featuredImage = dto.featuredImage ?? null;
    if (dto.publishedAt !== undefined) updates.publishedAt = new Date(dto.publishedAt);
    if (dto.status !== undefined) {
      updates.status = dto.status;
      if (dto.status === 'scheduled' && ((!updates.publishedAt && !post.publishedAt) || (updates.publishedAt && updates.publishedAt <= new Date()))) {
        throw new Error('Scheduled posts require a future publication date');
      }
      if (dto.status === 'published' && !post.publishedAt) updates.publishedAt = new Date();
    }

    const updated = await this.posts.update(post, updates);
    if (dto.categoryIds !== undefined) await this.posts.syncCategories(updated, dto.categoryIds);
    if (dto.tagIds !== undefined) await this.posts.syncTags(updated, dto.tagIds);
    return (await this.posts.findById(updated.id)) as PostEntity;
  }
}

@CommandHandler(DeletePostCommand)
export class DeletePostHandler implements ICommandHandler<DeletePostCommand, void> {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: IPostRepository) {}

  async execute({ id }: DeletePostCommand): Promise<void> {
    const post = await this.posts.findById(id);
    if (!post) throw new PostNotFoundException(id);
    await this.posts.delete(post);
  }
}

@CommandHandler(IncrementPostViewsCommand)
export class IncrementPostViewsHandler implements ICommandHandler<IncrementPostViewsCommand, void> {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: IPostRepository) {}

  async execute({ id }: IncrementPostViewsCommand): Promise<void> {
    await this.posts.incrementViews(id);
  }
}

@CommandHandler(PublishScheduledPostsCommand)
export class PublishScheduledPostsHandler implements ICommandHandler<PublishScheduledPostsCommand, void> {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: IPostRepository) {}

  async execute(): Promise<void> {
    await this.posts.publishScheduled();
  }
}
