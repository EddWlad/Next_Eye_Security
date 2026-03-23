import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UploadAttachmentFileDto } from './dto/upload-attachment-file.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { hasPaginationQuery } from '../../common/utils/pagination.util';

@Controller('attachments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  private resolveUploadedFile(
    files: Express.Multer.File[] | undefined,
  ): Express.Multer.File {
    const file = files?.[0];
    if (!file) {
      throw new BadRequestException('Debe adjuntar un archivo');
    }

    return file;
  }

  @Post()
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  create(
    @Body() dto: CreateAttachmentDto,
    @Req() req: { user: { email: string } },
  ) {
    return this.attachmentsService.create(dto, req.user);
  }

  @Post('upload')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  @UseInterceptors(AnyFilesInterceptor())
  upload(
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Body() dto: UploadAttachmentFileDto,
    @Req() req: { user: { email: string } },
  ) {
    const file = this.resolveUploadedFile(files);

    return this.attachmentsService.createFromUpload(dto, file, req.user);
  }

  @Post('upload/maintenance/:maintenanceId')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  @UseInterceptors(AnyFilesInterceptor())
  uploadMaintenanceEvidence(
    @Param('maintenanceId', new ParseUUIDPipe()) maintenanceId: string,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Req() req: { user: { email: string } },
  ) {
    const file = this.resolveUploadedFile(files);

    return this.attachmentsService.createMaintenanceEvidence(
      maintenanceId,
      file,
      req.user,
    );
  }

  @Get(':id/download')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  async download(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { attachment, fileBuffer } = await this.attachmentsService.getDownload(
      id,
    );

    const safeFileName = encodeURIComponent(attachment.originalName);
    res.setHeader(
      'Content-Type',
      attachment.mimeType || 'application/octet-stream',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${safeFileName}`,
    );
    res.send(fileBuffer);
  }

  @Get(':sourceEntity/:sourceEntityId')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  findBySource(
    @Param('sourceEntity') sourceEntity: string,
    @Param('sourceEntityId') sourceEntityId: string,
    @Query() query: PaginationQueryDto,
  ) {
    if (hasPaginationQuery(query)) {
      return this.attachmentsService.findBySourcePaginated(
        sourceEntity,
        sourceEntityId,
        query,
      );
    }

    return this.attachmentsService.findBySource(sourceEntity, sourceEntityId);
  }
}
