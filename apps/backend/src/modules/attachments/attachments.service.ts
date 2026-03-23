import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from './attachment.entity';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UploadAttachmentFileDto } from './dto/upload-attachment-file.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { Maintenance } from '../maintenance/maintenance.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../../common/utils/pagination.util';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentsRepository: Repository<Attachment>,
    @InjectRepository(Maintenance)
    private readonly maintenanceRepository: Repository<Maintenance>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    dto: CreateAttachmentDto,
    requestUser: { email: string },
  ): Promise<Attachment> {
    const sourceEntity = this.normalizeSourceEntity(dto.sourceEntity);
    await this.validateSourceAssociation(sourceEntity, dto.sourceEntityId);

    const attachment = this.attachmentsRepository.create({
      ...dto,
      sourceEntity,
      uploadedBy: requestUser.email,
    });
    const savedAttachment = await this.attachmentsRepository.save(attachment);
    await this.auditLogsService.register({
      module: 'attachments',
      entity: 'Attachment',
      entityId: savedAttachment.id,
      action: 'CREATE',
      user: requestUser.email,
      summary: `Adjunto registrado en ${dto.sourceEntity} (${dto.sourceEntityId})`,
      payloadSummary: dto,
    });
    return savedAttachment;
  }

  async createFromUpload(
    dto: UploadAttachmentFileDto,
    file: Express.Multer.File,
    requestUser: { email: string },
  ): Promise<Attachment> {
    const sourceEntity = this.normalizeSourceEntity(dto.sourceEntity);
    await this.validateSourceAssociation(sourceEntity, dto.sourceEntityId);

    const sourceDirectory = this.normalizePathSegment(sourceEntity);
    const uploadsDir = path.resolve(
      this.getBackendRootDir(),
      'uploads',
      sourceDirectory,
    );
    await fs.mkdir(uploadsDir, { recursive: true });

    const extension = path.extname(file.originalname ?? '');
    const storedName = `${Date.now()}-${randomUUID()}${extension}`;
    const absoluteStoragePath = path.join(uploadsDir, storedName);

    if (file.buffer && file.buffer.length > 0) {
      await fs.writeFile(absoluteStoragePath, file.buffer);
    } else if ((file as { path?: string }).path) {
      const tmpPath = (file as { path?: string }).path!;
      await fs.copyFile(tmpPath, absoluteStoragePath);
    } else {
      throw new BadRequestException(
        'No se pudo procesar el archivo adjunto recibido',
      );
    }

    return this.create(
      {
        sourceEntity,
        sourceEntityId: dto.sourceEntityId,
        originalName: file.originalname,
        storedName,
        mimeType: file.mimetype || 'application/octet-stream',
        storagePath: `/uploads/${sourceDirectory}/${storedName}`,
        size: String(file.size),
      },
      requestUser,
    );
  }

  async createMaintenanceEvidence(
    maintenanceId: string,
    file: Express.Multer.File,
    requestUser: { email: string },
  ): Promise<Attachment> {
    return this.createFromUpload(
      {
        sourceEntity: 'maintenance',
        sourceEntityId: maintenanceId,
      },
      file,
      requestUser,
    );
  }

  findBySource(
    sourceEntity: string,
    sourceEntityId: string,
  ): Promise<Attachment[]> {
    const normalizedSourceEntity = this.normalizeSourceEntity(sourceEntity);
    return this.attachmentsRepository.find({
      where: { sourceEntity: normalizedSourceEntity, sourceEntityId },
      order: { createdAt: 'DESC' },
    });
  }

  async findBySourcePaginated(
    sourceEntity: string,
    sourceEntityId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Attachment>> {
    const normalizedSourceEntity = this.normalizeSourceEntity(sourceEntity);
    const { page, limit, skip } = resolvePagination(query, 10);
    const [items, total] = await this.attachmentsRepository.findAndCount({
      where: { sourceEntity: normalizedSourceEntity, sourceEntityId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return buildPaginatedResponse(items, total, page, limit);
  }

  async getDownload(
    id: string,
  ): Promise<{ attachment: Attachment; fileBuffer: Buffer }> {
    const attachment = await this.attachmentsRepository.findOne({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException('Adjunto no encontrado');
    }

    const absolutePath = this.resolveAbsoluteStoragePath(attachment.storagePath);
    const legacyPath = this.resolveLegacyAbsoluteStoragePath(
      attachment.storagePath,
    );

    try {
      const fileBuffer = await fs.readFile(absolutePath);
      return { attachment, fileBuffer };
    } catch {
      try {
        const fileBuffer = await fs.readFile(legacyPath);
        return { attachment, fileBuffer };
      } catch {
        throw new NotFoundException('Archivo de evidencia no encontrado');
      }
    }
  }

  private normalizeSourceEntity(value: string): string {
    return value.trim().toLowerCase();
  }

  private async validateSourceAssociation(
    sourceEntity: string,
    sourceEntityId: string,
  ): Promise<void> {
    if (!sourceEntityId?.trim()) {
      throw new BadRequestException('sourceEntityId es requerido');
    }

    if (sourceEntity === 'maintenance') {
      const maintenanceExists = await this.maintenanceRepository.exist({
        where: { id: sourceEntityId },
      });

      if (!maintenanceExists) {
        throw new NotFoundException(
          'Mantenimiento no encontrado para adjuntar evidencia',
        );
      }
    }
  }

  private normalizePathSegment(value: string): string {
    const normalized = value
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return normalized || 'general';
  }

  private resolveAbsoluteStoragePath(storagePath: string): string {
    const normalized = storagePath.replace(/^[/\\]+/, '');
    return path.resolve(this.getBackendRootDir(), normalized);
  }

  private resolveLegacyAbsoluteStoragePath(storagePath: string): string {
    const normalized = storagePath.replace(/^[/\\]+/, '');
    return path.resolve(process.cwd(), normalized);
  }

  private getBackendRootDir(): string {
    return path.resolve(__dirname, '..', '..', '..');
  }
}
