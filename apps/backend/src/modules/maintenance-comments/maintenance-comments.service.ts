import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceComment } from './maintenance-comment.entity';
import { CreateMaintenanceCommentDto } from './dto/create-maintenance-comment.dto';
import { Maintenance } from '../maintenance/maintenance.entity';
import { User } from '../users/user.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class MaintenanceCommentsService {
  constructor(
    @InjectRepository(MaintenanceComment)
    private readonly commentsRepository: Repository<MaintenanceComment>,
    @InjectRepository(Maintenance)
    private readonly maintenanceRepository: Repository<Maintenance>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    dto: CreateMaintenanceCommentDto,
    requestUser: { sub: string; email: string },
  ): Promise<MaintenanceComment> {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id: dto.maintenanceId },
    });
    if (!maintenance) {
      throw new NotFoundException('Mantenimiento no encontrado');
    }
    const user = await this.usersRepository.findOne({
      where: { id: requestUser.sub },
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const comment = this.commentsRepository.create({
      maintenance,
      user,
      comment: dto.comment,
    });
    const savedComment = await this.commentsRepository.save(comment);
    await this.auditLogsService.register({
      module: 'maintenance-comments',
      entity: 'MaintenanceComment',
      entityId: savedComment.id,
      action: 'CREATE',
      user: requestUser.email,
      summary: `Comentario técnico agregado al mantenimiento ${maintenance.id}`,
      payloadSummary: dto,
    });
    return savedComment;
  }

  findByMaintenance(maintenanceId: string): Promise<MaintenanceComment[]> {
    return this.commentsRepository.find({
      where: { maintenance: { id: maintenanceId } },
      order: { createdAt: 'ASC' },
    });
  }
}
