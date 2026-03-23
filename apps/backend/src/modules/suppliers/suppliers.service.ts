import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Supplier } from './supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../../common/utils/pagination.util';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly suppliersRepository: Repository<Supplier>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    createSupplierDto: CreateSupplierDto,
    actor: string,
  ): Promise<Supplier> {
    const exists = await this.suppliersRepository.findOne({
      where: { ruc: createSupplierDto.ruc },
    });
    if (exists) {
      throw new BadRequestException('El RUC ya está registrado');
    }

    const supplier = this.suppliersRepository.create({
      ...createSupplierDto,
      active: createSupplierDto.active ?? true,
      email: createSupplierDto.email?.toLowerCase() ?? null,
    });

    const savedSupplier = await this.suppliersRepository.save(supplier);
    await this.auditLogsService.register({
      module: 'suppliers',
      entity: 'Supplier',
      entityId: savedSupplier.id,
      action: 'CREATE',
      user: actor,
      summary: `Proveedor creado: ${savedSupplier.businessName}`,
      payloadSummary: createSupplierDto,
    });
    return savedSupplier;
  }

  findAll(): Promise<Supplier[]> {
    return this.suppliersRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findAllPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Supplier>> {
    const { page, limit, skip } = resolvePagination(query, 10);
    const [items, total] = await this.suppliersRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return buildPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findOne({ where: { id } });
    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }
    return supplier;
  }

  async update(
    id: string,
    updateSupplierDto: UpdateSupplierDto,
    actor: string,
  ): Promise<Supplier> {
    const supplier = await this.findOne(id);

    if (updateSupplierDto.ruc && updateSupplierDto.ruc !== supplier.ruc) {
      const exists = await this.suppliersRepository.findOne({
        where: { ruc: updateSupplierDto.ruc },
      });
      if (exists) {
        throw new BadRequestException('El RUC ya está registrado');
      }
    }

    Object.assign(supplier, {
      ...updateSupplierDto,
      email:
        updateSupplierDto.email !== undefined
          ? updateSupplierDto.email?.toLowerCase()
          : supplier.email,
    });

    const savedSupplier = await this.suppliersRepository.save(supplier);
    await this.auditLogsService.register({
      module: 'suppliers',
      entity: 'Supplier',
      entityId: savedSupplier.id,
      action: 'UPDATE',
      user: actor,
      summary: `Proveedor actualizado: ${savedSupplier.businessName}`,
      payloadSummary: updateSupplierDto,
    });
    return savedSupplier;
  }

  async remove(id: string, actor: string): Promise<void> {
    const supplier = await this.findOne(id);
    const supplierId = supplier.id;
    try {
      await this.suppliersRepository.remove(supplier);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23503'
      ) {
        throw new BadRequestException(
          'No se puede eliminar el proveedor porque está relacionado con productos.',
        );
      }
      throw error;
    }

    await this.auditLogsService.register({
      module: 'suppliers',
      entity: 'Supplier',
      entityId: supplierId,
      action: 'DELETE',
      user: actor,
      summary: `Proveedor eliminado: ${supplier.businessName}`,
    });
  }
}
