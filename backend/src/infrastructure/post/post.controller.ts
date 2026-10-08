import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UserEntity } from '../../domain/user/entities/user.entity';
import { CreatePostUseCase } from '../../application/post/use-cases/create-post.use-case';
import { UpdatePostUseCase } from '../../application/post/use-cases/update-post.use-case';
import { DeletePostUseCase } from '../../application/post/use-cases/delete-post.use-case';
import { GetPostListUseCase } from '../../application/post/use-cases/get-post-list.use-case';
import { GetPostByIdUseCase } from '../../application/post/use-cases/get-post-by-id.use-case';
import { CreatePostDto } from '../../application/post/dto/create-post.dto';
import { UpdatePostDto } from '../../application/post/dto/update-post.dto';
import { PostFiltersDto } from '../../application/post/dto/post-filters.dto';
import { PostRepository } from './post.repository';
import { PostResource } from './resources/post.resource';

@Controller('api/v1/posts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostController {
  constructor(
    private readonly getPostList: GetPostListUseCase,
    private readonly getPostById: GetPostByIdUseCase,
    private readonly createPost: CreatePostUseCase,
    private readonly updatePost: UpdatePostUseCase,
    private readonly deletePost: DeletePostUseCase,
    private readonly postRepository: PostRepository,
  ) {}

  @Get()
  @Roles('admin', 'editor')
  async index(@Query() filters: PostFiltersDto) {
    const result = await this.getPostList.execute(filters);
    return {
      data: PostResource.collection(result.data),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        lastPage: result.lastPage,
      },
      stats: await this.postRepository.getStats(),
    };
  }

  @Get(':id')
  @Roles('admin', 'editor')
  async show(@Param('id', ParseIntPipe) id: number) {
    const post = await this.getPostById.execute(id);
    return { data: PostResource.from(post) };
  }

  @Post()
  @Roles('admin', 'editor')
  async store(@Body() dto: CreatePostDto, @CurrentUser() user: UserEntity) {
    const post = await this.createPost.execute(dto, user.id);
    return { data: PostResource.from(post) };
  }

  @Put(':id')
  @Roles('admin', 'editor')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePostDto, @CurrentUser() user: UserEntity) {
    await this.assertCanManage(id, user);
    const post = await this.updatePost.execute(id, dto);
    return { data: PostResource.from(post) };
  }

  @Delete(':id')
  @Roles('admin', 'editor')
  async destroy(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    await this.assertCanManage(id, user);
    await this.deletePost.execute(id);
    return { message: 'Post deleted successfully' };
  }

  private async assertCanManage(postId: number, user: UserEntity) {
    if (user.hasAnyRole(['admin'])) return;
    const post = await this.getPostById.execute(postId);
    if (post.authorId !== user.id) throw new ForbiddenException('You can only manage your own posts');
  }
}
