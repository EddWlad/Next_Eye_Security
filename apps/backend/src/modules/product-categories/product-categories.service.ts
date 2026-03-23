import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ProductCategory } from './product-category.entity';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../../common/utils/pagination.util';

@Injectable()
export class ProductCategoriesService {
  constructor(
    @InjectRepository(ProductCategory)
    private readonly categoriesRepository: Repository<ProductCategory>,
  ) {}

  async create(dto: CreateProductCategoryDto): Promise<ProductCategory> {
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

  findAll(): Promise<ProductCategory[]> {
    return this.categoriesRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findAllPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<ProductCategory>> {
    const { page, limit, skip } = resolvePagination(query, 10);
    const [items, total] = await this.categoriesRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return buildPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string): Promise<ProductCategory> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Categoría de producto no encontrada');
    }
    return category;
  }

  async update(
    id: string,
    dto: UpdateProductCategoryDto,
  ): Promise<ProductCategory> {
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
          'No se puede eliminar la categoría porque está relacionada con productos.',
        );
      }
      throw error;
    }
  }
}
