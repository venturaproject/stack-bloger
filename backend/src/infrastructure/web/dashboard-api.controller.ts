import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostOrmEntity } from '../database/entities/post.orm.entity';
import { CategoryOrmEntity } from '../database/entities/category.orm.entity';
import { TagOrmEntity } from '../database/entities/tag.orm.entity';

@Controller('api/v1/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardApiController {
  constructor(
    @InjectRepository(PostOrmEntity)
    private readonly postRepository: Repository<PostOrmEntity>,
    @InjectRepository(CategoryOrmEntity)
    private readonly categoryRepository: Repository<CategoryOrmEntity>,
    @InjectRepository(TagOrmEntity)
    private readonly tagRepository: Repository<TagOrmEntity>,
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
