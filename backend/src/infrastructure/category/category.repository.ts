import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../../domain/post/entities/category.entity';
import { CategoryOrmEntity } from '../database/entities/category.orm.entity';
import { CategoryMapper } from '../database/mappers/category.mapper';
import { ICategoryRepository } from '../../domain/post/repositories/category.repository.interface';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly orm: Repository<CategoryOrmEntity>,
  ) {}

  async findAll(): Promise<CategoryEntity[]> {
    return (await this.orm.find({ order: { name: 'ASC' } })).map(CategoryMapper.toDomain);
  }

  async findById(id: number): Promise<CategoryEntity | null> {
    const category = await this.orm.findOneBy({ id });
    return category ? CategoryMapper.toDomain(category) : null;
  }

  async findBySlug(slug: string): Promise<CategoryEntity | null> {
    const category = await this.orm.findOneBy({ slug });
    return category ? CategoryMapper.toDomain(category) : null;
  }

  async create(data: Partial<CategoryEntity>): Promise<CategoryEntity> {
    const category = await this.orm.save(this.orm.create(data));
    return CategoryMapper.toDomain(category);
  }

  async update(category: CategoryEntity, data: Partial<CategoryEntity>): Promise<CategoryEntity> {
    const entity = await this.orm.findOneByOrFail({ id: category.id });
    Object.assign(entity, data);
    return CategoryMapper.toDomain(await this.orm.save(entity));
  }

  async delete(category: CategoryEntity): Promise<void> {
    await this.orm.delete(category.id);
  }

  async generateSlug(name: string): Promise<string> {
    const base = name
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
}
