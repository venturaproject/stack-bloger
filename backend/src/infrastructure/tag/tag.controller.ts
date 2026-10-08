import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CreateTagUseCase } from '../../application/tag/use-cases/create-tag.use-case';
import { UpdateTagUseCase } from '../../application/tag/use-cases/update-tag.use-case';
import { DeleteTagUseCase } from '../../application/tag/use-cases/delete-tag.use-case';
import { GetTagListUseCase } from '../../application/tag/use-cases/get-tag-list.use-case';
import { CreateTagDto } from '../../application/tag/dto/create-tag.dto';
import { UpdateTagDto } from '../../application/tag/dto/update-tag.dto';

@Controller('api/v1/tags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TagController {
  constructor(
    private readonly getTagList: GetTagListUseCase,
    private readonly createTag: CreateTagUseCase,
    private readonly updateTag: UpdateTagUseCase,
    private readonly deleteTag: DeleteTagUseCase,
  ) {}

  @Get()
  @Roles('admin', 'editor')
  async index() {
    const tags = await this.getTagList.execute();
    return {
      data: tags.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    };
  }

  @Post()
  @Roles('admin', 'editor')
  async store(@Body() dto: CreateTagDto) {
    const tag = await this.createTag.execute(dto);
    return {
      data: {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        createdAt: tag.createdAt.toISOString(),
        updatedAt: tag.updatedAt.toISOString(),
      },
    };
  }

  @Put(':id')
  @Roles('admin', 'editor')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTagDto) {
    const tag = await this.updateTag.execute(id, dto);
    return {
      data: {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        createdAt: tag.createdAt.toISOString(),
        updatedAt: tag.updatedAt.toISOString(),
      },
    };
  }

  @Delete(':id')
  @Roles('admin', 'editor')
  async destroy(@Param('id', ParseIntPipe) id: number) {
    await this.deleteTag.execute(id);
    return { message: 'Tag deleted successfully' };
  }
}

@Controller('api/v1/public/tags')
export class PublicTagController {
  constructor(private readonly getTagList: GetTagListUseCase) {}

  @Get()
  async index() {
    const tags = await this.getTagList.execute();
    return {
      data: tags.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
      })),
    };
  }
}
