import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Maintenance } from './maintenance.entity';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { Client } from '../clients/client.entity';
import { User } from '../users/user.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Role } from '../../common/enums/role.enum';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../../common/utils/pagination.util';

type RequestUser = {
  sub: string;
  email: string;
  role: Role;
};

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(Maintenance)
    private readonly maintenanceRepository: Repository<Maintenance>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private normalizeTechnicianId(value?: string): string | undefined {
    if (!value) {
      return undefined;
    }

    const normalized = value.trim();
    if (!normalized || normalized === 'null' || normalized.includes('{{')) {
      return undefined;
    }

    return normalized;
  }

  private async buildRelations(
    dto: CreateMaintenanceDto | UpdateMaintenanceDto,
  ) {
    const client = dto.clientId
      ? await this.clientsRepository.findOne({ where: { id: dto.clientId } })
      : null;
    if (dto.clientId && !client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const technician = dto.technicianId
      ? await this.usersRepository.findOne({ where: { id: dto.technicianId } })
      : null;
    if (dto.technicianId && !technician) {
      throw new NotFoundException('Técnico no encontrado');
    }

    return { client, technician };
  }

  async create(
    dto: CreateMaintenanceDto,
    requestUser: RequestUser,
  ): Promise<Maintenance> {
    const technicianId =
      this.normalizeTechnicianId(dto.technicianId) ?? requestUser.sub;
    const createPayload: CreateMaintenanceDto = {
      ...dto,
      technicianId,
    };

    const { client, technician } = await this.buildRelations(createPayload);
    if (!client || !technician) {
      throw new NotFoundException('Relaciones de mantenimiento inválidas');
    }

    const maintenance = this.maintenanceRepository.create({
      ...createPayload,
      client,
      technician,
      status: dto.status,
      executionDate: dto.executionDate ?? null,
      observations: dto.observations ?? null,
    });
    const savedMaintenance = await this.maintenanceRepository.save(maintenance);

    await this.auditLogsService.register({
      module: 'maintenance',
      entity: 'Maintenance',
      entityId: savedMaintenance.id,
      action: 'CREATE',
      user: requestUser.email,
      summary: `Mantenimiento creado (${savedMaintenance.type})`,
      payloadSummary: createPayload,
    });

    return savedMaintenance;
  }

  async findAll(requestUser: RequestUser): Promise<Maintenance[]> {
    if (requestUser.role === Role.TECNICO) {
      return this.maintenanceRepository.find({
        where: { technician: { id: requestUser.sub } },
        order: { createdAt: 'DESC' },
      });
    }
    return this.maintenanceRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findAllPaginated(
    requestUser: RequestUser,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Maintenance>> {
    const { page, limit, skip } = resolvePagination(query, 10);
    const where =
      requestUser.role === Role.TECNICO
        ? { technician: { id: requestUser.sub } }
        : undefined;

    const [items, total] = await this.maintenanceRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return buildPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string, requestUser: RequestUser): Promise<Maintenance> {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id },
    });
    if (!maintenance) {
      throw new NotFoundException('Mantenimiento no encontrado');
    }
    if (
      requestUser.role === Role.TECNICO &&
      maintenance.technician.id !== requestUser.sub
    ) {
      throw new NotFoundException('Mantenimiento no encontrado');
    }
    return maintenance;
  }

  async update(
    id: string,
    dto: UpdateMaintenanceDto,
    requestUser: RequestUser,
  ): Promise<Maintenance> {
    const maintenance = await this.findOne(id, requestUser);
    const { client, technician } = await this.buildRelations(dto);

    Object.assign(maintenance, {
      ...dto,
      client: client ?? maintenance.client,
      technician: technician ?? maintenance.technician,
      executionDate:
        dto.executionDate !== undefined
          ? dto.executionDate
          : maintenance.executionDate,
      observations:
        dto.observations !== undefined
          ? dto.observations
          : maintenance.observations,
    });

    const savedMaintenance = await this.maintenanceRepository.save(maintenance);
    await this.auditLogsService.register({
      module: 'maintenance',
      entity: 'Maintenance',
      entityId: savedMaintenance.id,
      action: 'UPDATE',
      user: requestUser.email,
      summary: `Mantenimiento actualizado (${savedMaintenance.type})`,
      payloadSummary: dto,
    });
    return savedMaintenance;
  }

  async remove(id: string, requestUser: RequestUser): Promise<void> {
    const maintenance = await this.findOne(id, requestUser);
    const maintenanceId = maintenance.id;
    await this.maintenanceRepository.remove(maintenance);
    await this.auditLogsService.register({
      module: 'maintenance',
      entity: 'Maintenance',
      entityId: maintenanceId,
      action: 'DELETE',
      user: requestUser.email,
      summary: `Mantenimiento eliminado (${maintenance.type})`,
    });
  }
}
