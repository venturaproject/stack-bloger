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
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateCategoryUseCase } from '../../application/category/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from '../../application/category/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from '../../application/category/use-cases/delete-category.use-case';
import { GetCategoryListUseCase } from '../../application/category/use-cases/get-category-list.use-case';
import { CreateCategoryDto } from '../../application/category/dto/create-category.dto';
import { UpdateCategoryDto } from '../../application/category/dto/update-category.dto';

@Controller('api/v1/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoryController {
  constructor(
    private readonly getCategoryList: GetCategoryListUseCase,
    private readonly createCategory: CreateCategoryUseCase,
    private readonly updateCategory: UpdateCategoryUseCase,
    private readonly deleteCategory: DeleteCategoryUseCase,
  ) {}

  @Get()
  @Roles('admin', 'editor')
  async index() {
    const categories = await this.getCategoryList.execute();
    return {
      data: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    };
  }

  @Post()
  @Roles('admin', 'editor')
  async store(@Body() dto: CreateCategoryDto) {
    const category = await this.createCategory.execute(dto);
    return {
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
      },
    };
  }

  @Put(':id')
  @Roles('admin', 'editor')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    const category = await this.updateCategory.execute(id, dto);
    return {
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
      },
    };
  }

  @Delete(':id')
  @Roles('admin', 'editor')
  async destroy(@Param('id', ParseIntPipe) id: number) {
    await this.deleteCategory.execute(id);
    return { message: 'Category deleted successfully' };
  }
}

@Controller('api/v1/public/categories')
export class PublicCategoryController {
  constructor(private readonly getCategoryList: GetCategoryListUseCase) {}

  @Get()
  async index() {
    const categories = await this.getCategoryList.execute();
    return {
      data: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
      })),
    };
  }
}
