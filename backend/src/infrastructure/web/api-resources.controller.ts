import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Throttle } from '@nestjs/throttler';
import { ApiClientGuard } from '../auth/guards/api-client.guard';
import { ApiScopes } from '../auth/decorators/api-scopes.decorator';
import { PostOrmEntity } from '../database/entities/post.orm.entity';
import { CategoryOrmEntity } from '../database/entities/category.orm.entity';
import { TagOrmEntity } from '../database/entities/tag.orm.entity';
import { PostMapper } from '../database/mappers/post.mapper';
import { PostFiltersDto } from '../../application/post/dto/post-filters.dto';
import { PostResource } from '../post/resources/post.resource';

@Controller('api/v1/integrations')
@UseGuards(ApiClientGuard)
@Throttle({ long: { ttl: 60000, limit: 120 } })
export class ApiResourcesController {
  constructor(
    @InjectRepository(PostOrmEntity) private readonly posts: Repository<PostOrmEntity>,
    @InjectRepository(CategoryOrmEntity) private readonly categories: Repository<CategoryOrmEntity>,
    @InjectRepository(TagOrmEntity) private readonly tags: Repository<TagOrmEntity>,
  ) {}

  @Get('posts')
  @ApiScopes('posts:read')
  async postsList(@Query() filters: PostFiltersDto) {
    const page = Math.max(filters.page ?? 1, 1);
    const perPage = Math.min(filters.perPage ?? 20, 100);
    const qb = this.posts.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.categories', 'category')
      .leftJoinAndSelect('post.tags', 'tag')
      .where('post.status = :status', { status: 'published' });
    if (filters.search) qb.andWhere(`to_tsvector('simple', coalesce(post.title, '') || ' ' || coalesce(post.excerpt, '') || ' ' || coalesce(post.content, '')) @@ plainto_tsquery('simple', :search)`, { search: filters.search });
    if (filters.categorySlug) qb.andWhere('category.slug = :categorySlug', { categorySlug: filters.categorySlug });
    if (filters.tagSlug) qb.andWhere('tag.slug = :tagSlug', { tagSlug: filters.tagSlug });
    const orderColumn = filters.order === 'popular' ? 'post.viewCount' : 'post.publishedAt';
    const [items, total] = await qb.orderBy(orderColumn, filters.order === 'oldest' ? 'ASC' : 'DESC').skip((page - 1) * perPage).take(perPage).getManyAndCount();
    return { data: PostResource.collection(items.map(PostMapper.toDomain)), meta: { total, page, perPage, lastPage: Math.ceil(total / perPage) } };
  }

  @Get('categories')
  @ApiScopes('categories:read')
  async categoriesList() {
    const categories = await this.categories.createQueryBuilder('category').innerJoin('category.posts', 'post', 'post.status = :status', { status: 'published' }).select(['category.id', 'category.name', 'category.slug']).distinct(true).orderBy('category.name', 'ASC').getMany();
    return { data: categories };
  }

  @Get('tags')
  @ApiScopes('tags:read')
  async tagsList() {
    const tags = await this.tags.createQueryBuilder('tag').innerJoin('tag.posts', 'post', 'post.status = :status', { status: 'published' }).select(['tag.id', 'tag.name', 'tag.slug']).distinct(true).orderBy('tag.name', 'ASC').getMany();
    return { data: tags };
  }
}
