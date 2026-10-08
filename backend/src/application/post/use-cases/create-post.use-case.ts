import { Inject, Injectable } from '@nestjs/common';
import { IPostRepository, POST_REPOSITORY } from '../../../domain/post/repositories/post.repository.interface';
import { CreatePostDto } from '../dto/create-post.dto';
import { PostEntity } from '../../../domain/post/entities/post.entity';

@Injectable()
export class CreatePostUseCase {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(dto: CreatePostDto, authorId: number): Promise<PostEntity> {
    const slug = dto.slug ?? await this.postRepository.generateSlug(dto.title);
    const scheduledAt = dto.publishedAt ? new Date(dto.publishedAt) : null;
    if (dto.status === 'scheduled' && (!scheduledAt || scheduledAt <= new Date())) {
      throw new Error('Scheduled posts require a future publication date');
    }

    const post = await this.postRepository.create({
      title: dto.title,
      slug,
      content: dto.content,
      excerpt: dto.excerpt ?? null,
      featuredImage: dto.featuredImage ?? null,
      status: dto.status ?? 'draft',
      authorId,
      publishedAt: dto.status === 'published' ? new Date() : dto.status === 'scheduled' ? scheduledAt : null,
    });

    if (dto.categoryIds?.length) {
      await this.postRepository.syncCategories(post, dto.categoryIds);
    }

    if (dto.tagIds?.length) {
      await this.postRepository.syncTags(post, dto.tagIds);
    }

    return this.postRepository.findById(post.id) as Promise<PostEntity>;
  }
}
