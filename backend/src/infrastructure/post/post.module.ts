import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { PostOrmEntity } from '../database/entities/post.orm.entity';
import { CategoryOrmEntity } from '../database/entities/category.orm.entity';
import { TagOrmEntity } from '../database/entities/tag.orm.entity';
import { POST_REPOSITORY } from '../../domain/post/repositories/post.repository.interface';
import { PostRepository } from './post.repository';
import { PostController } from './post.controller';
import { PublicPostController, RssFeedController, SitemapController } from './public-post.controller';
import { PublishScheduledPostsService } from '../../application/post/services/publish-scheduled-posts.service';
import {
  CreatePostHandler,
  DeletePostHandler,
  IncrementPostViewsHandler,
  PublishScheduledPostsHandler,
  UpdatePostHandler,
} from '../../application/post/handlers/post-command.handlers';
import {
  GetPostByIdHandler,
  GetPostBySlugHandler,
  GetPostListHandler,
  GetPostStatsHandler,
  GetRelatedPostsHandler,
} from '../../application/post/handlers/post-query.handlers';
import { PostCommentOrmEntity } from '../database/entities/post-comment.orm.entity';
import { PostReactionOrmEntity } from '../database/entities/post-reaction.orm.entity';
import { PostBookmarkOrmEntity } from '../database/entities/post-bookmark.orm.entity';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([PostOrmEntity, CategoryOrmEntity, TagOrmEntity, PostCommentOrmEntity, PostReactionOrmEntity, PostBookmarkOrmEntity]),
  ],
  controllers: [PostController, PublicPostController, RssFeedController, SitemapController],
  providers: [
    PostRepository,
    { provide: POST_REPOSITORY, useClass: PostRepository },
    CreatePostHandler,
    UpdatePostHandler,
    DeletePostHandler,
    IncrementPostViewsHandler,
    PublishScheduledPostsHandler,
    GetPostListHandler,
    GetPostByIdHandler,
    GetPostBySlugHandler,
    GetRelatedPostsHandler,
    GetPostStatsHandler,
    PublishScheduledPostsService,
  ],
  exports: [POST_REPOSITORY],
})
export class PostModule {}
