import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostEntity } from '../../domain/post/entities/post.entity';
import { CategoryEntity } from '../../domain/post/entities/category.entity';
import { TagEntity } from '../../domain/post/entities/tag.entity';

@Controller('api/v1/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardApiController {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(TagEntity)
    private readonly tagRepository: Repository<TagEntity>,
  ) {}

  @Get()
  async index() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      archivedPosts,
      totalCategories,
      totalTags,
      publishedThisMonth,
      recentPosts,
      popularPosts,
    ] = await Promise.all([
      this.postRepository.count(),
      this.postRepository.count({ where: { status: 'published' } }),
      this.postRepository.count({ where: { status: 'draft' } }),
      this.postRepository.count({ where: { status: 'archived' } }),
      this.categoryRepository.count(),
      this.tagRepository.count(),
      this.postRepository
        .createQueryBuilder('p')
        .where('p.publishedAt >= :startOfMonth', { startOfMonth })
        .getCount(),
      this.postRepository.find({
        where: { status: 'published' },
        relations: { author: true, categories: true },
        order: { publishedAt: 'DESC' },
        take: 5,
      }),
      this.postRepository.find({
        where: { status: 'published' },
        order: { viewCount: 'DESC' },
        take: 5,
      }),
    ]);

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      archivedPosts,
      totalCategories,
      totalTags,
      publishedThisMonth,
      recentPosts: recentPosts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.status,
        publishedAt: p.publishedAt?.toISOString() ?? null,
        author: p.author ? { id: p.author.id, name: p.author.name } : null,
        categories: (p.categories ?? []).map((c) => ({ id: c.id, name: c.name })),
      })),
      popularPosts: popularPosts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        viewCount: p.viewCount,
      })),
    };
  }
}
