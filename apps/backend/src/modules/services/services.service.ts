import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Service } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceCategory } from '../service-categories/service-category.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../../common/utils/pagination.util';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
    @InjectRepository(ServiceCategory)
    private readonly categoriesRepository: Repository<ServiceCategory>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(dto: CreateServiceDto, actor: string): Promise<Service> {
    const category = await this.categoriesRepository.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Categoría de servicio no encontrada');
    }

    const service = this.servicesRepository.create({
      ...dto,
      category,
      active: dto.active ?? true,
    });
    const savedService = await this.servicesRepository.save(service);
    await this.auditLogsService.register({
      module: 'services',
      entity: 'Service',
      entityId: savedService.id,
      action: 'CREATE',
      user: actor,
      summary: `Servicio creado: ${savedService.name}`,
      payloadSummary: dto,
    });
    return savedService;
  }

  findAll(): Promise<Service[]> {
    return this.servicesRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findAllPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Service>> {
    const { page, limit, skip } = resolvePagination(query, 10);
    const [items, total] = await this.servicesRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return buildPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return service;
  }

  async update(
    id: string,
    dto: UpdateServiceDto,
    actor: string,
  ): Promise<Service> {
    const service = await this.findOne(id);
    const category = dto.categoryId
      ? await this.categoriesRepository.findOne({
          where: { id: dto.categoryId },
        })
      : null;

    if (dto.categoryId && !category) {
      throw new NotFoundException('Categoría de servicio no encontrada');
    }

    Object.assign(service, {
      ...dto,
      category: category ?? service.category,
    });
    const savedService = await this.servicesRepository.save(service);
    await this.auditLogsService.register({
      module: 'services',
      entity: 'Service',
      entityId: savedService.id,
      action: 'UPDATE',
      user: actor,
      summary: `Servicio actualizado: ${savedService.name}`,
      payloadSummary: dto,
    });
    return savedService;
  }

  async remove(id: string, actor: string): Promise<void> {
    const service = await this.findOne(id);
    const serviceId = service.id;
    try {
      await this.servicesRepository.remove(service);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23503'
      ) {
        throw new BadRequestException(
          'No se puede eliminar el servicio porque está relacionado con otros registros.',
        );
      }
      throw error;
    }

    await this.auditLogsService.register({
      module: 'services',
      entity: 'Service',
      entityId: serviceId,
      action: 'DELETE',
      user: actor,
      summary: `Servicio eliminado: ${service.name}`,
    });
  }
}
