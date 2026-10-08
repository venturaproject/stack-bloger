import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PostEntity } from '../../domain/post/entities/post.entity';
import { CategoryEntity } from '../../domain/post/entities/category.entity';
import { TagEntity } from '../../domain/post/entities/tag.entity';
import {
  IPostRepository,
  PaginatedResult,
  PostFilters,
  PostStats,
} from '../../domain/post/repositories/post.repository.interface';

@Injectable()
export class PostRepository implements IPostRepository {
  constructor(
    @InjectRepository(PostEntity)
    private readonly orm: Repository<PostEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryOrm: Repository<CategoryEntity>,
    @InjectRepository(TagEntity)
    private readonly tagOrm: Repository<TagEntity>,
  ) {}

  findById(id: number): Promise<PostEntity | null> {
    return this.orm.findOne({
      where: { id },
      relations: { author: true, categories: true, tags: true },
    });
  }

  findBySlug(slug: string): Promise<PostEntity | null> {
    return this.orm.findOne({
      where: { slug },
      relations: { author: true, categories: true, tags: true },
    });
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
    const data = await qb
      .orderBy(orderBy, direction)
      .skip((page - 1) * perPage)
      .take(perPage)
      .getMany();

    return { data, total, page, perPage, lastPage: Math.ceil(total / perPage) };
  }

  async create(data: Partial<PostEntity>): Promise<PostEntity> {
    const post = this.orm.create(data);
    return this.orm.save(post);
  }

  async update(post: PostEntity, data: Partial<PostEntity>): Promise<PostEntity> {
    Object.assign(post, data);
    return this.orm.save(post);
  }

  async delete(post: PostEntity): Promise<void> {
    await this.orm.remove(post);
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
    const categories = categoryIds.length > 0
      ? await this.categoryOrm.findBy({ id: In(categoryIds) })
      : [];
    post.categories = categories;
    return this.orm.save(post);
  }

  async syncTags(post: PostEntity, tagIds: number[]): Promise<PostEntity> {
    const tags = tagIds.length > 0
      ? await this.tagOrm.findBy({ id: In(tagIds) })
      : [];
    post.tags = tags;
    return this.orm.save(post);
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

    return qb.orderBy('post.publishedAt', 'DESC').take(limit).getMany();
  }

  async incrementViews(id: number): Promise<void> {
    await this.orm.createQueryBuilder().update(PostEntity).set({ viewCount: () => '"viewCount" + 1' }).where('id = :id', { id }).execute();
  }

  async publishScheduled(): Promise<void> {
    await this.orm.createQueryBuilder().update(PostEntity).set({ status: 'published' }).where('status = :status AND "publishedAt" <= NOW()', { status: 'scheduled' }).execute();
  }
}
