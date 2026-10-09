import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagEntity } from '../../domain/post/entities/tag.entity';
import { TagOrmEntity } from '../database/entities/tag.orm.entity';
import { TagMapper } from '../database/mappers/tag.mapper';
import { ITagRepository } from '../../domain/post/repositories/tag.repository.interface';

@Injectable()
export class TagRepository implements ITagRepository {
  constructor(
    @InjectRepository(TagOrmEntity)
    private readonly orm: Repository<TagOrmEntity>,
  ) {}

  async findAll(): Promise<TagEntity[]> {
    return (await this.orm.find({ order: { name: 'ASC' } })).map(TagMapper.toDomain);
  }

  async findById(id: number): Promise<TagEntity | null> {
    const tag = await this.orm.findOneBy({ id });
    return tag ? TagMapper.toDomain(tag) : null;
  }

  async findBySlug(slug: string): Promise<TagEntity | null> {
    const tag = await this.orm.findOneBy({ slug });
    return tag ? TagMapper.toDomain(tag) : null;
  }

  async create(data: Partial<TagEntity>): Promise<TagEntity> {
    const tag = await this.orm.save(this.orm.create(data));
    return TagMapper.toDomain(tag);
  }

  async update(tag: TagEntity, data: Partial<TagEntity>): Promise<TagEntity> {
    const entity = await this.orm.findOneByOrFail({ id: tag.id });
    Object.assign(entity, data);
    return TagMapper.toDomain(await this.orm.save(entity));
  }

  async delete(tag: TagEntity): Promise<void> {
    await this.orm.delete(tag.id);
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
