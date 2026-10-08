import { TagEntity } from '../entities/tag.entity';

export const TAG_REPOSITORY = Symbol('TAG_REPOSITORY');

export interface ITagRepository {
  findAll(): Promise<TagEntity[]>;
  findById(id: number): Promise<TagEntity | null>;
  findBySlug(slug: string): Promise<TagEntity | null>;
  create(data: Partial<TagEntity>): Promise<TagEntity>;
  update(tag: TagEntity, data: Partial<TagEntity>): Promise<TagEntity>;
  delete(tag: TagEntity): Promise<void>;
  generateSlug(name: string): Promise<string>;
}
