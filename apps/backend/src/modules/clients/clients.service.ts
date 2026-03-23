import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Client } from './client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../../common/utils/pagination.util';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    createClientDto: CreateClientDto,
    actor: string,
  ): Promise<Client> {
    const exists = await this.clientsRepository.findOne({
      where: { documentNumber: createClientDto.documentNumber },
    });
    if (exists) {
      throw new BadRequestException('El documento ya está registrado');
    }

    const client = this.clientsRepository.create({
      ...createClientDto,
      active: createClientDto.active ?? true,
      email: createClientDto.email?.toLowerCase() ?? null,
    });

    const savedClient = await this.clientsRepository.save(client);
    await this.auditLogsService.register({
      module: 'clients',
      entity: 'Client',
      entityId: savedClient.id,
      action: 'CREATE',
      user: actor,
      summary: `Cliente creado: ${savedClient.nameOrBusinessName}`,
      payloadSummary: createClientDto,
    });
    return savedClient;
  }

  findAll(): Promise<Client[]> {
    return this.clientsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findAllPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Client>> {
    const { page, limit, skip } = resolvePagination(query, 10);
    const [items, total] = await this.clientsRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return buildPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientsRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return client;
  }

  async update(
    id: string,
    updateClientDto: UpdateClientDto,
    actor: string,
  ): Promise<Client> {
    const client = await this.findOne(id);

    if (
      updateClientDto.documentNumber &&
      updateClientDto.documentNumber !== client.documentNumber
    ) {
      const exists = await this.clientsRepository.findOne({
        where: { documentNumber: updateClientDto.documentNumber },
      });
      if (exists) {
        throw new BadRequestException('El documento ya está registrado');
      }
    }

    Object.assign(client, {
      ...updateClientDto,
      email:
        updateClientDto.email !== undefined
          ? updateClientDto.email?.toLowerCase()
          : client.email,
    });
    const savedClient = await this.clientsRepository.save(client);
    await this.auditLogsService.register({
      module: 'clients',
      entity: 'Client',
      entityId: savedClient.id,
      action: 'UPDATE',
      user: actor,
      summary: `Cliente actualizado: ${savedClient.nameOrBusinessName}`,
      payloadSummary: updateClientDto,
    });
    return savedClient;
  }

  async remove(id: string, actor: string): Promise<void> {
    const client = await this.findOne(id);
    const clientId = client.id;
    try {
      await this.clientsRepository.remove(client);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23503'
      ) {
        throw new BadRequestException(
          'No se puede eliminar el cliente porque tiene registros relacionados.',
        );
      }
      throw error;
    }

    await this.auditLogsService.register({
      module: 'clients',
      entity: 'Client',
      entityId: clientId,
      action: 'DELETE',
      user: actor,
      summary: `Cliente eliminado: ${client.nameOrBusinessName}`,
    });
  }
}
