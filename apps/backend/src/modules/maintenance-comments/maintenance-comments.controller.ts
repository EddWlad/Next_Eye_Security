import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MaintenanceCommentsService } from './maintenance-comments.service';
import { CreateMaintenanceCommentDto } from './dto/create-maintenance-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('maintenance-comments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceCommentsController {
  constructor(private readonly commentsService: MaintenanceCommentsService) {}

  @Post()
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  create(
    @Body() dto: CreateMaintenanceCommentDto,
    @Req() req: { user: { sub: string; email: string } },
  ) {
    return this.commentsService.create(dto, req.user);
  }

  @Get('maintenance/:maintenanceId')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  findByMaintenance(@Param('maintenanceId') maintenanceId: string) {
    return this.commentsService.findByMaintenance(maintenanceId);
  }
}
