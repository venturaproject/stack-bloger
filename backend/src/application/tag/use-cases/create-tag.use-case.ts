import { Inject, Injectable } from '@nestjs/common';
import { TAG_REPOSITORY, ITagRepository } from '../../../domain/post/repositories/tag.repository.interface';
import { CreateTagDto } from '../dto/create-tag.dto';
import { TagEntity } from '../../../domain/post/entities/tag.entity';

@Injectable()
export class CreateTagUseCase {
  constructor(
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: ITagRepository,
  ) {}

  async execute(dto: CreateTagDto): Promise<TagEntity> {
    const slug = dto.slug ?? await this.tagRepository.generateSlug(dto.name);
    return this.tagRepository.create({ name: dto.name, slug });
  }
}
