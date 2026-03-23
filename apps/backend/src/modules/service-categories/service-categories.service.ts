import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ServiceCategory } from './service-category.entity';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../../common/utils/pagination.util';

@Injectable()
export class ServiceCategoriesService {
  constructor(
    @InjectRepository(ServiceCategory)
    private readonly categoriesRepository: Repository<ServiceCategory>,
  ) {}

  async create(dto: CreateServiceCategoryDto): Promise<ServiceCategory> {
    const exists = await this.categoriesRepository.findOne({
      where: { name: dto.name.trim() },
    });
    if (exists) {
      throw new BadRequestException('La categoría ya existe');
    }

    const category = this.categoriesRepository.create({
      ...dto,
      name: dto.name.trim(),
      active: dto.active ?? true,
    });
    return this.categoriesRepository.save(category);
  }

  findAll(): Promise<ServiceCategory[]> {
    return this.categoriesRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findAllPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ServiceCategory>> {
    const { page, limit, skip } = resolvePagination(query, 10);
    const [items, total] = await this.categoriesRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return buildPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string): Promise<ServiceCategory> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Categoría de servicio no encontrada');
    }
    return category;
  }

  async update(
    id: string,
    dto: UpdateServiceCategoryDto,
  ): Promise<ServiceCategory> {
    const category = await this.findOne(id);
    if (dto.name && dto.name !== category.name) {
      const exists = await this.categoriesRepository.findOne({
        where: { name: dto.name.trim() },
      });
      if (exists) {
        throw new BadRequestException('La categoría ya existe');
      }
    }

    Object.assign(category, {
      ...dto,
      name: dto.name?.trim() ?? category.name,
    });
    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    try {
      await this.categoriesRepository.remove(category);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23503'
      ) {
        throw new BadRequestException(
          'No se puede eliminar la categoría porque está relacionada con servicios.',
        );
      }
      throw error;
    }
  }
}
