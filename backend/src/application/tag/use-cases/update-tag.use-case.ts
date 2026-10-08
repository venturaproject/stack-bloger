import { Inject, Injectable } from '@nestjs/common';
import { TAG_REPOSITORY, ITagRepository } from '../../../domain/post/repositories/tag.repository.interface';
import { TagNotFoundException } from '../../../domain/post/exceptions/tag-not-found.exception';
import { UpdateTagDto } from '../dto/update-tag.dto';
import { TagEntity } from '../../../domain/post/entities/tag.entity';

@Injectable()
export class UpdateTagUseCase {
  constructor(
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: ITagRepository,
  ) {}

  async execute(id: number, dto: UpdateTagDto): Promise<TagEntity> {
    const tag = await this.tagRepository.findById(id);
    if (!tag) throw new TagNotFoundException(id);

    const updates: Partial<TagEntity> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.slug !== undefined) updates.slug = dto.slug;

    return this.tagRepository.update(tag, updates);
  }
}
