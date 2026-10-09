import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagOrmEntity } from '../database/entities/tag.orm.entity';
import { TAG_REPOSITORY } from '../../domain/post/repositories/tag.repository.interface';
import { TagRepository } from './tag.repository';
import { TagController, PublicTagController } from './tag.controller';
import { CreateTagUseCase } from '../../application/tag/use-cases/create-tag.use-case';
import { UpdateTagUseCase } from '../../application/tag/use-cases/update-tag.use-case';
import { DeleteTagUseCase } from '../../application/tag/use-cases/delete-tag.use-case';
import { GetTagListUseCase } from '../../application/tag/use-cases/get-tag-list.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([TagOrmEntity])],
  controllers: [TagController, PublicTagController],
  providers: [
    TagRepository,
    { provide: TAG_REPOSITORY, useClass: TagRepository },
    CreateTagUseCase,
    UpdateTagUseCase,
    DeleteTagUseCase,
    GetTagListUseCase,
  ],
  exports: [TAG_REPOSITORY, GetTagListUseCase],
})
export class TagModule {}
