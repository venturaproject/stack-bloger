import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../../domain/post/entities/category.entity';
import { ICategoryRepository } from '../../domain/post/repositories/category.repository.interface';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly orm: Repository<CategoryEntity>,
  ) {}

  findAll(): Promise<CategoryEntity[]> {
    return this.orm.find({ order: { name: 'ASC' } });
  }

  findById(id: number): Promise<CategoryEntity | null> {
    return this.orm.findOneBy({ id });
  }

  findBySlug(slug: string): Promise<CategoryEntity | null> {
    return this.orm.findOneBy({ slug });
  }

  async create(data: Partial<CategoryEntity>): Promise<CategoryEntity> {
    const category = this.orm.create(data);
    return this.orm.save(category);
  }

  async update(category: CategoryEntity, data: Partial<CategoryEntity>): Promise<CategoryEntity> {
    Object.assign(category, data);
    return this.orm.save(category);
  }

  async delete(category: CategoryEntity): Promise<void> {
    await this.orm.remove(category);
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
