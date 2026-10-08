import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from '../../domain/post/entities/post.entity';
import { CategoryEntity } from '../../domain/post/entities/category.entity';
import { TagEntity } from '../../domain/post/entities/tag.entity';
import { POST_REPOSITORY } from '../../domain/post/repositories/post.repository.interface';
import { PostRepository } from './post.repository';
import { PostController } from './post.controller';
import { PublicPostController, RssFeedController, SitemapController } from './public-post.controller';
import { CreatePostUseCase } from '../../application/post/use-cases/create-post.use-case';
import { UpdatePostUseCase } from '../../application/post/use-cases/update-post.use-case';
import { DeletePostUseCase } from '../../application/post/use-cases/delete-post.use-case';
import { GetPostListUseCase } from '../../application/post/use-cases/get-post-list.use-case';
import { GetPostByIdUseCase } from '../../application/post/use-cases/get-post-by-id.use-case';
import { GetPostBySlugUseCase } from '../../application/post/use-cases/get-post-by-slug.use-case';
import { PublishScheduledPostsService } from '../../application/post/services/publish-scheduled-posts.service';
import { PostCommentEntity } from '../../domain/post/entities/post-comment.entity';
import { PostReactionEntity } from '../../domain/post/entities/post-reaction.entity';
import { PostBookmarkEntity } from '../../domain/post/entities/post-bookmark.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity, CategoryEntity, TagEntity, PostCommentEntity, PostReactionEntity, PostBookmarkEntity])],
  controllers: [PostController, PublicPostController, RssFeedController, SitemapController],
  providers: [
    PostRepository,
    { provide: POST_REPOSITORY, useClass: PostRepository },
    CreatePostUseCase,
    UpdatePostUseCase,
    DeletePostUseCase,
    GetPostListUseCase,
    GetPostByIdUseCase,
    GetPostBySlugUseCase,
    PublishScheduledPostsService,
  ],
  exports: [POST_REPOSITORY, GetPostListUseCase, GetPostBySlugUseCase],
})
export class PostModule {}
