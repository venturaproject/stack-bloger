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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserEntity } from '../../domain/user/entities/user.entity';
import { CreatePostCommand, DeletePostCommand, UpdatePostCommand } from '../../application/post/commands/post.commands';
import { GetPostByIdQuery, GetPostListQuery, GetPostStatsQuery } from '../../application/post/queries/post.queries';
import { CreatePostDto } from '../../application/post/dto/create-post.dto';
import { UpdatePostDto } from '../../application/post/dto/update-post.dto';
import { PostFiltersDto } from '../../application/post/dto/post-filters.dto';
import { PostResource } from './resources/post.resource';

@Controller('api/v1/posts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @Roles('admin', 'editor')
  async index(@Query() filters: PostFiltersDto) {
    const result = await this.queryBus.execute(new GetPostListQuery(filters));
    return {
      data: PostResource.collection(result.data),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        lastPage: result.lastPage,
      },
      stats: await this.queryBus.execute(new GetPostStatsQuery()),
    };
  }

  @Get(':id')
  @Roles('admin', 'editor')
  async show(@Param('id', ParseIntPipe) id: number) {
    const post = await this.queryBus.execute(new GetPostByIdQuery(id));
    return { data: PostResource.from(post) };
  }

  @Post()
  @Roles('admin', 'editor')
  async store(@Body() dto: CreatePostDto, @CurrentUser() user: UserEntity) {
    const post = await this.commandBus.execute(new CreatePostCommand(dto, user.id));
    return { data: PostResource.from(post) };
  }

  @Put(':id')
  @Roles('admin', 'editor')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePostDto, @CurrentUser() user: UserEntity) {
    await this.assertCanManage(id, user);
    const post = await this.commandBus.execute(new UpdatePostCommand(id, dto));
    return { data: PostResource.from(post) };
  }

  @Delete(':id')
  @Roles('admin', 'editor')
  async destroy(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: UserEntity) {
    await this.assertCanManage(id, user);
    await this.commandBus.execute(new DeletePostCommand(id));
    return { message: 'Post deleted successfully' };
  }

  private async assertCanManage(postId: number, user: UserEntity) {
    if (user.hasAnyRole(['admin'])) return;
    const post = await this.queryBus.execute(new GetPostByIdQuery(postId));
    if (post.authorId !== user.id) throw new ForbiddenException('You can only manage your own posts');
  }
}
