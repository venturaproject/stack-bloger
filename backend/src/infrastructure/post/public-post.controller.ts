import { Body, BadRequestException, Controller, Get, Post, Param, Query, Inject, Res, Header, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetPostListUseCase } from '../../application/post/use-cases/get-post-list.use-case';
import { GetPostBySlugUseCase } from '../../application/post/use-cases/get-post-by-slug.use-case';
import { PostFiltersDto } from '../../application/post/dto/post-filters.dto';
import { PostResource } from './resources/post.resource';
import { IPostRepository, POST_REPOSITORY } from '../../domain/post/repositories/post.repository.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserEntity } from '../../domain/user/entities/user.entity';
import { ReactionType } from '../../domain/post/entities/post-reaction.entity';
import { PostCommentOrmEntity } from '../database/entities/post-comment.orm.entity';
import { PostReactionOrmEntity } from '../database/entities/post-reaction.orm.entity';
import { PostBookmarkOrmEntity } from '../database/entities/post-bookmark.orm.entity';
import { normalizeAvatarUrl } from '../user/avatar-url';

@Controller('api/v1/public/posts')
export class PublicPostController {
  constructor(
    private readonly getPostList: GetPostListUseCase,
    private readonly getPostBySlug: GetPostBySlugUseCase,
    @Inject(POST_REPOSITORY) private readonly postRepo: IPostRepository,
    @InjectRepository(PostCommentOrmEntity) private readonly commentRepo: Repository<PostCommentOrmEntity>,
    @InjectRepository(PostReactionOrmEntity) private readonly reactionRepo: Repository<PostReactionOrmEntity>,
    @InjectRepository(PostBookmarkOrmEntity) private readonly bookmarkRepo: Repository<PostBookmarkOrmEntity>,
  ) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
  async index(@Query() filters: PostFiltersDto) {
    const result = await this.getPostList.execute({ ...filters, status: 'published' });
    return {
      data: PostResource.collection(result.data),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        lastPage: result.lastPage,
      },
    };
  }

  @Get(':slug/related')
  @Header('Cache-Control', 'public, max-age=300')
  async related(@Param('slug') slug: string) {
    const post = await this.getPostBySlug.execute(slug);
    const categoryIds = (post.categories ?? []).map((c) => c.id);
    const related = await this.postRepo.findRelated(post.id, categoryIds, 3);
    return { data: PostResource.collection(related) };
  }

  @Get(':slug')
  @Header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=300')
  async show(@Param('slug') slug: string) {
    const post = await this.getPostBySlug.execute(slug);
    return { data: PostResource.from(post) };
  }

  @Post(':slug/view')
  async recordView(@Param('slug') slug: string) {
    const post = await this.getPostBySlug.execute(slug);
    await this.postRepo.incrementViews(post.id);
    return { success: true };
  }

  @Get(':slug/comments')
  async comments(@Param('slug') slug: string) {
    const post = await this.getPostBySlug.execute(slug);
    const comments = await this.commentRepo.find({ where: { postId: post.id, status: 'approved' }, relations: { user: { settings: true } }, order: { createdAt: 'ASC' } });
    return { data: comments.map((comment) => ({ id: comment.id, content: comment.content, createdAt: comment.createdAt.toISOString(), user: { id: comment.user.id, name: comment.user.name, avatar: normalizeAvatarUrl(comment.user.settings?.avatar) } })) };
  }

  @Get(':slug/engagement')
  async engagement(@Param('slug') slug: string) {
    const post = await this.getPostBySlug.execute(slug);
    const reactions = await this.reactionRepo.createQueryBuilder('reaction').select('reaction.type', 'type').addSelect('COUNT(*)', 'count').where('reaction.post_id = :postId', { postId: post.id }).groupBy('reaction.type').getRawMany<{ type: ReactionType; count: string }>();
    const reactionCounts = { heart: 0, unicorn: 0, lightbulb: 0 };
    reactions.forEach((reaction) => { reactionCounts[reaction.type] = Number(reaction.count); });
    const commentCount = await this.commentRepo.count({ where: { postId: post.id } });
    return { data: { reactionCounts, commentCount } };
  }

  @Post(':slug/comments')
  @UseGuards(JwtAuthGuard)
  async createComment(@Param('slug') slug: string, @Body() body: { content?: string }, @CurrentUser() user: UserEntity) {
    const content = body.content?.trim();
    if (!content || content.length > 2000) throw new BadRequestException('Comment must be between 1 and 2000 characters');
    const post = await this.getPostBySlug.execute(slug);
    const comment = await this.commentRepo.save(this.commentRepo.create({ postId: post.id, userId: user.id, content, status: 'pending' }));
    return { data: { id: comment.id, content: comment.content, status: comment.status, createdAt: comment.createdAt.toISOString(), user: { id: user.id, name: user.name, avatar: normalizeAvatarUrl(user.settings?.avatar) } } };
  }

  @Post(':slug/reactions')
  @UseGuards(JwtAuthGuard)
  async toggleReaction(@Param('slug') slug: string, @Body() body: { type?: ReactionType }, @CurrentUser() user: UserEntity) {
    if (!body.type || !['heart', 'unicorn', 'lightbulb'].includes(body.type)) throw new BadRequestException('Invalid reaction type');
    const post = await this.getPostBySlug.execute(slug);
    const existing = await this.reactionRepo.findOneBy({ postId: post.id, userId: user.id, type: body.type });
    if (existing) await this.reactionRepo.remove(existing);
    else await this.reactionRepo.save(this.reactionRepo.create({ postId: post.id, userId: user.id, type: body.type }));
    return this.engagement(slug);
  }

  @Post(':slug/bookmark')
  @UseGuards(JwtAuthGuard)
  async toggleBookmark(@Param('slug') slug: string, @CurrentUser() user: UserEntity) {
    const post = await this.getPostBySlug.execute(slug);
    const existing = await this.bookmarkRepo.findOneBy({ postId: post.id, userId: user.id });
    if (existing) { await this.bookmarkRepo.remove(existing); return { data: { bookmarked: false } }; }
    await this.bookmarkRepo.save(this.bookmarkRepo.create({ postId: post.id, userId: user.id }));
    return { data: { bookmarked: true } };
  }
}

@Controller()
export class RssFeedController {
  constructor(private readonly getPostList: GetPostListUseCase) {}

  @Get('feed.xml')
  async rss(@Res() res: Response) {
    const result = await this.getPostList.execute({ status: 'published', perPage: 20, page: 1 });
    const siteUrl = process.env.FRONTEND_URL ?? 'http://localhost:8081';
    const appName = process.env.VITE_APP_NAME ?? 'Blog';

    const items = result.data.map((post) => {
      const pubDate = (post.publishedAt ?? post.createdAt).toUTCString();
      const excerpt = post.excerpt ? this.escapeXml(post.excerpt) : '';
      return `
    <item>
      <title>${this.escapeXml(post.title)}</title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid>${siteUrl}/blog/${post.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${excerpt}</description>
    </item>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${this.escapeXml(appName)}</title>
    <link>${siteUrl}</link>
    <description>${this.escapeXml(appName)} RSS Feed</description>
    <language>es</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    res.send(xml);
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

@Controller()
export class SitemapController {
  constructor(private readonly getPostList: GetPostListUseCase) {}

  @Get('sitemap.xml')
  async sitemap(@Res() res: Response) {
    const firstPage = await this.getPostList.execute({ status: 'published', perPage: 100, page: 1 });
    const pages = await Promise.all(
      Array.from({ length: Math.max(firstPage.lastPage - 1, 0) }, (_, index) =>
        this.getPostList.execute({ status: 'published', perPage: 100, page: index + 2 }),
      ),
    );
    const posts = [firstPage, ...pages].flatMap((result) => result.data);
    const siteUrl = process.env.FRONTEND_URL ?? 'http://localhost:8081';

    const urls = posts.map((post) => {
      const lastmod = (post.updatedAt ?? post.createdAt).toISOString().split('T')[0];
      return `
  <url>
    <loc>${siteUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>${urls}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  }
}
