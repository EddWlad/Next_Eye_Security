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
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { hasPaginationQuery } from '../../common/utils/pagination.util';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles(Role.ADMINISTRADOR)
  create(
    @Body() createSupplierDto: CreateSupplierDto,
    @Req() req: { user: { email: string } },
  ) {
    return this.suppliersService.create(createSupplierDto, req.user.email);
  }

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  findAll(@Query() query: PaginationQueryDto) {
    if (hasPaginationQuery(query)) {
      return this.suppliersService.findAllPaginated(query);
    }
    return this.suppliersService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMINISTRADOR)
  update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
    @Req() req: { user: { email: string } },
  ) {
    return this.suppliersService.update(id, updateSupplierDto, req.user.email);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRADOR)
  async remove(
    @Param('id') id: string,
    @Req() req: { user: { email: string } },
  ) {
    await this.suppliersService.remove(id, req.user.email);
    return { message: 'Proveedor eliminado correctamente' };
  }
}
