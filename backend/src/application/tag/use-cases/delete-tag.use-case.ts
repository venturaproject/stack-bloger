import { Inject, Injectable } from '@nestjs/common';
import { TAG_REPOSITORY, ITagRepository } from '../../../domain/post/repositories/tag.repository.interface';
import { TagNotFoundException } from '../../../domain/post/exceptions/tag-not-found.exception';

@Injectable()
export class DeleteTagUseCase {
  constructor(
    @Inject(TAG_REPOSITORY)
    private readonly tagRepository: ITagRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const tag = await this.tagRepository.findById(id);
    if (!tag) throw new TagNotFoundException(id);
    await this.tagRepository.delete(tag);
  }
}
