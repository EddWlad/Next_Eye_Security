import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { hasPaginationQuery } from '../../common/utils/pagination.util';

type RequestUser = {
  sub: string;
  email: string;
  role: Role;
};

@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  create(@Body() dto: CreateMaintenanceDto, @Req() req: { user: RequestUser }) {
    return this.maintenanceService.create(dto, req.user);
  }

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  findAll(
    @Req() req: { user: RequestUser },
    @Query() query: PaginationQueryDto,
  ) {
    if (hasPaginationQuery(query)) {
      return this.maintenanceService.findAllPaginated(req.user, query);
    }
    return this.maintenanceService.findAll(req.user);
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: { user: RequestUser },
  ) {
    return this.maintenanceService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateMaintenanceDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.maintenanceService.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: { user: RequestUser },
  ) {
    await this.maintenanceService.remove(id, req.user);
    return { message: 'Mantenimiento eliminado correctamente' };
  }
}
