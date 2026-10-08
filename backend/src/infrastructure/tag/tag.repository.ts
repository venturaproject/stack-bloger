import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagEntity } from '../../domain/post/entities/tag.entity';
import { ITagRepository } from '../../domain/post/repositories/tag.repository.interface';

@Injectable()
export class TagRepository implements ITagRepository {
  constructor(
    @InjectRepository(TagEntity)
    private readonly orm: Repository<TagEntity>,
  ) {}

  findAll(): Promise<TagEntity[]> {
    return this.orm.find({ order: { name: 'ASC' } });
  }

  findById(id: number): Promise<TagEntity | null> {
    return this.orm.findOneBy({ id });
  }

  findBySlug(slug: string): Promise<TagEntity | null> {
    return this.orm.findOneBy({ slug });
  }

  async create(data: Partial<TagEntity>): Promise<TagEntity> {
    const tag = this.orm.create(data);
    return this.orm.save(tag);
  }

  async update(tag: TagEntity, data: Partial<TagEntity>): Promise<TagEntity> {
    Object.assign(tag, data);
    return this.orm.save(tag);
  }

  async delete(tag: TagEntity): Promise<void> {
    await this.orm.remove(tag);
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
