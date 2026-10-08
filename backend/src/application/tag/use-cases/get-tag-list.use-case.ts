import { Inject, Injectable } from '@nestjs/common';
import { TAG_REPOSITORY, ITagRepository } from '../../../domain/post/repositories/tag.repository.interface';
import { TagEntity } from '../../../domain/post/entities/tag.entity';

@Injectable()
export class GetTagListUseCase {
  constructor(
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: ITagRepository,
  ) {}

  async execute(): Promise<TagEntity[]> {
    return this.tagRepository.findAll();
  }
}
