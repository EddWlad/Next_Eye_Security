import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { hasPaginationQuery } from '../../common/utils/pagination.util';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles(Role.ADMINISTRADOR)
  findAll(@Query() query: PaginationQueryDto) {
    if (hasPaginationQuery(query)) {
      return this.auditLogsService.findAllPaginated(query);
    }

    const parsedLimit = Number(query.limit ?? 100);
    return this.auditLogsService.findAll(
      Number.isFinite(parsedLimit) ? parsedLimit : 100,
    );
  }
}
