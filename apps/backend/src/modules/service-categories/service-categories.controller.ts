import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ServiceCategoriesService } from './service-categories.service';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { hasPaginationQuery } from '../../common/utils/pagination.util';

@Controller('service-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceCategoriesController {
  constructor(private readonly categoriesService: ServiceCategoriesService) {}

  @Post()
  @Roles(Role.ADMINISTRADOR)
  create(@Body() dto: CreateServiceCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  findAll(@Query() query: PaginationQueryDto) {
    if (hasPaginationQuery(query)) {
      return this.categoriesService.findAllPaginated(query);
    }
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMINISTRADOR)
  update(@Param('id') id: string, @Body() dto: UpdateServiceCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRADOR)
  async remove(@Param('id') id: string) {
    await this.categoriesService.remove(id);
    return { message: 'Categoría eliminada correctamente' };
  }
}
