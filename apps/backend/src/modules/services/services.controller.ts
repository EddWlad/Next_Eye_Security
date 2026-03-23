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
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { hasPaginationQuery } from '../../common/utils/pagination.util';

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Roles(Role.ADMINISTRADOR)
  create(
    @Body() dto: CreateServiceDto,
    @Req() req: { user: { email: string } },
  ) {
    return this.servicesService.create(dto, req.user.email);
  }

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  findAll(@Query() query: PaginationQueryDto) {
    if (hasPaginationQuery(query)) {
      return this.servicesService.findAllPaginated(query);
    }
    return this.servicesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMINISTRADOR)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @Req() req: { user: { email: string } },
  ) {
    return this.servicesService.update(id, dto, req.user.email);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRADOR)
  async remove(
    @Param('id') id: string,
    @Req() req: { user: { email: string } },
  ) {
    await this.servicesService.remove(id, req.user.email);
    return { message: 'Servicio eliminado correctamente' };
  }
}
