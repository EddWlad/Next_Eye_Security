import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../../common/utils/pagination.util';

interface CreateAuditLogInput {
  module: string;
  entity: string;
  entityId: string;
  action: string;
  user: string;
  summary: string;
  payloadSummary?: unknown;
}

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogsRepository: Repository<AuditLog>,
  ) {}

  async register(input: CreateAuditLogInput): Promise<void> {
    const log = this.auditLogsRepository.create({
      ...input,
      payloadSummary: input.payloadSummary
        ? JSON.stringify(input.payloadSummary)
        : null,
    });
    await this.auditLogsRepository.save(log);
  }

  async findAll(limit = 100): Promise<AuditLog[]> {
    return this.auditLogsRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findAllPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<AuditLog>> {
    const { page, limit, skip } = resolvePagination(query, 20);
    const [items, total] = await this.auditLogsRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return buildPaginatedResponse(items, total, page, limit);
  }
}
