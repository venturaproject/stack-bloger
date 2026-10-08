import { Inject, Injectable } from '@nestjs/common';
import { IPostRepository, POST_REPOSITORY } from '../../../domain/post/repositories/post.repository.interface';
import { PostNotFoundException } from '../../../domain/post/exceptions/post-not-found.exception';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostEntity } from '../../../domain/post/entities/post.entity';

@Injectable()
export class UpdatePostUseCase {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(id: number, dto: UpdatePostDto): Promise<PostEntity> {
    const post = await this.postRepository.findById(id);
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
      if (dto.status === 'scheduled' && (!updates.publishedAt && !post.publishedAt || updates.publishedAt && updates.publishedAt <= new Date())) {
        throw new Error('Scheduled posts require a future publication date');
      }
      if (dto.status === 'published' && !post.publishedAt) {
        updates.publishedAt = new Date();
      }
    }

    const updated = await this.postRepository.update(post, updates);

    if (dto.categoryIds !== undefined) {
      await this.postRepository.syncCategories(updated, dto.categoryIds);
    }

    if (dto.tagIds !== undefined) {
      await this.postRepository.syncTags(updated, dto.tagIds);
    }

    return this.postRepository.findById(updated.id) as Promise<PostEntity>;
  }
}
