import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationStatusDto } from './dto/update-quotation-status.dto';
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

@Controller('quotations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  create(@Body() dto: CreateQuotationDto, @Req() req: { user: RequestUser }) {
    return this.quotationsService.create(dto, req.user);
  }

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  findAll(
    @Req() req: { user: RequestUser },
    @Query() query: PaginationQueryDto,
  ) {
    if (hasPaginationQuery(query)) {
      return this.quotationsService.findAllPaginated(req.user, query);
    }
    return this.quotationsService.findAll(req.user);
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  findOne(@Param('id') id: string, @Req() req: { user: RequestUser }) {
    return this.quotationsService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  updateDraft(
    @Param('id') id: string,
    @Body() dto: CreateQuotationDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.quotationsService.updateDraft(id, dto, req.user);
  }

  @Patch(':id/status')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateQuotationStatusDto,
    @Req() req: { user: RequestUser },
  ) {
    return this.quotationsService.updateStatus(id, dto, req.user);
  }

  @Get(':id/pdf')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(
    @Param('id') id: string,
    @Req() req: { user: RequestUser },
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.quotationsService.buildPdfBuffer(id, req.user);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="cotizacion-${id}.pdf"`,
    );
    res.send(pdfBuffer);
  }
}
