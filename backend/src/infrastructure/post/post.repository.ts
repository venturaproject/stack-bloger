import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PostEntity } from '../../domain/post/entities/post.entity';
import { PostOrmEntity } from '../database/entities/post.orm.entity';
import { CategoryOrmEntity } from '../database/entities/category.orm.entity';
import { TagOrmEntity } from '../database/entities/tag.orm.entity';
import { PostMapper } from '../database/mappers/post.mapper';
import {
  IPostRepository,
  PaginatedResult,
  PostFilters,
  PostStats,
} from '../../domain/post/repositories/post.repository.interface';

@Injectable()
export class PostRepository implements IPostRepository {
  constructor(
    @InjectRepository(PostOrmEntity)
    private readonly orm: Repository<PostOrmEntity>,
    @InjectRepository(CategoryOrmEntity)
    private readonly categoryOrm: Repository<CategoryOrmEntity>,
    @InjectRepository(TagOrmEntity)
    private readonly tagOrm: Repository<TagOrmEntity>,
  ) {}

  async findById(id: number): Promise<PostEntity | null> {
    const post = await this.orm.findOne({
      where: { id },
      relations: { author: true, categories: true, tags: true },
    });
    return post ? PostMapper.toDomain(post) : null;
  }

  async findBySlug(slug: string): Promise<PostEntity | null> {
    const post = await this.orm.findOne({
      where: { slug },
      relations: { author: true, categories: true, tags: true },
    });
    return post ? PostMapper.toDomain(post) : null;
  }

  async getPaginated(filters: PostFilters): Promise<PaginatedResult<PostEntity>> {
    const page = filters.page ?? 1;
    const perPage = filters.perPage ?? 20;

    const qb = this.orm
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.categories', 'category')
      .leftJoinAndSelect('post.tags', 'tag');

    if (filters.search) {
      qb.andWhere(`to_tsvector('simple', coalesce(post.title, '') || ' ' || coalesce(post.excerpt, '') || ' ' || coalesce(post.content, '')) @@ plainto_tsquery('simple', :search)`, { search: filters.search });
    }

    if (filters.status) {
      qb.andWhere('post.status = :status', { status: filters.status });
    }

    if (filters.categorySlug) {
      qb.andWhere('category.slug = :categorySlug', { categorySlug: filters.categorySlug });
    }

    if (filters.tagSlug) {
      qb.andWhere('tag.slug = :tagSlug', { tagSlug: filters.tagSlug });
    }

    if (filters.authorId) {
      qb.andWhere('post.authorId = :authorId', { authorId: filters.authorId });
    }

    const total = await qb.getCount();

    const orderBy = filters.order === 'popular' ? 'post.viewCount' : filters.status === 'published' ? 'post.publishedAt' : 'post.createdAt';
    const direction = filters.order === 'oldest' ? 'ASC' : 'DESC';
    const rows = await qb
      .orderBy(orderBy, direction)
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    return { data: rows.map(PostMapper.toDomain), total, page, perPage, lastPage: Math.ceil(total / perPage) };
  }

  async create(data: Partial<PostEntity>): Promise<PostEntity> {
    const post = await this.orm.save(this.orm.create(PostMapper.toPersistence(data)));
    return PostMapper.toDomain(post);
  }

  async update(post: PostEntity, data: Partial<PostEntity>): Promise<PostEntity> {
    const entity = await this.orm.findOneByOrFail({ id: post.id });
    Object.assign(entity, PostMapper.toPersistence(data));
    return PostMapper.toDomain(await this.orm.save(entity));
  }

  async delete(post: PostEntity): Promise<void> {
    await this.orm.delete(post.id);
  }

  async generateSlug(title: string): Promise<string> {
    const base = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    let slug = base;
    let counter = 1;

    while (await this.orm.findOneBy({ slug })) {
      slug = `${base}-${counter}`;
      counter++;
    }

    return slug;
  }

  async getStats(): Promise<PostStats> {
    const [total, published, draft, archived] = await Promise.all([
      this.orm.count(),
      this.orm.count({ where: { status: 'published' } }),
      this.orm.count({ where: { status: 'draft' } }),
      this.orm.count({ where: { status: 'archived' } }),
    ]);

    return { total, published, draft, archived };
  }

  async syncCategories(post: PostEntity, categoryIds: number[]): Promise<PostEntity> {
    const entity = await this.orm.findOneByOrFail({ id: post.id });
    const categories = categoryIds.length > 0
      ? await this.categoryOrm.findBy({ id: In(categoryIds) })
      : [];
    entity.categories = categories;
    await this.orm.save(entity);
    return (await this.findById(post.id)) as PostEntity;
  }

  async syncTags(post: PostEntity, tagIds: number[]): Promise<PostEntity> {
    const entity = await this.orm.findOneByOrFail({ id: post.id });
    const tags = tagIds.length > 0
      ? await this.tagOrm.findBy({ id: In(tagIds) })
      : [];
    entity.tags = tags;
    await this.orm.save(entity);
    return (await this.findById(post.id)) as PostEntity;
  }

  async findRelated(postId: number, categoryIds: number[], limit: number): Promise<PostEntity[]> {
    const qb = this.orm
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.categories', 'category')
      .leftJoinAndSelect('post.tags', 'tag')
      .where('post.status = :status', { status: 'published' })
      .andWhere('post.id != :postId', { postId });

    if (categoryIds.length > 0) {
      qb.andWhere('category.id IN (:...categoryIds)', { categoryIds });
    }

    return (await qb.orderBy('post.publishedAt', 'DESC').take(limit).getMany()).map(PostMapper.toDomain);
  }

  async incrementViews(id: number): Promise<void> {
    await this.orm.createQueryBuilder().update(PostOrmEntity).set({ viewCount: () => '"viewCount" + 1' }).where('id = :id', { id }).execute();
  }

  async publishScheduled(): Promise<void> {
    await this.orm.createQueryBuilder().update(PostOrmEntity).set({ status: 'published' }).where('status = :status AND "publishedAt" <= NOW()', { status: 'scheduled' }).execute();
  }
}
