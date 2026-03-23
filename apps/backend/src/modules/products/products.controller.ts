import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { hasPaginationQuery } from '../../common/utils/pagination.util';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(Role.ADMINISTRADOR)
  create(
    @Body() dto: CreateProductDto,
    @Req() req: { user: { email: string } },
  ) {
    return this.productsService.create(dto, req.user.email);
  }

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  findAll(@Query() query: PaginationQueryDto) {
    if (hasPaginationQuery(query)) {
      return this.productsService.findAllPaginated(query);
    }
    return this.productsService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMINISTRADOR)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() req: { user: { email: string } },
  ) {
    return this.productsService.update(id, dto, req.user.email);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRADOR)
  async remove(
    @Param('id') id: string,
    @Req() req: { user: { email: string } },
  ) {
    await this.productsService.remove(id, req.user.email);
    return { message: 'Producto eliminado correctamente' };
  }
}
