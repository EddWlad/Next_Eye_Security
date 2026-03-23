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
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { hasPaginationQuery } from '../../common/utils/pagination.util';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  create(
    @Body() createClientDto: CreateClientDto,
    @Req() req: { user: { email: string } },
  ) {
    return this.clientsService.create(createClientDto, req.user.email);
  }

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  findAll(@Query() query: PaginationQueryDto) {
    if (hasPaginationQuery(query)) {
      return this.clientsService.findAllPaginated(query);
    }
    return this.clientsService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
    @Req() req: { user: { email: string } },
  ) {
    return this.clientsService.update(id, updateClientDto, req.user.email);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  async remove(
    @Param('id') id: string,
    @Req() req: { user: { email: string } },
  ) {
    await this.clientsService.remove(id, req.user.email);
    return { message: 'Cliente eliminado correctamente' };
  }
}
