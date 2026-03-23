import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductCategory } from '../product-categories/product-category.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../../common/utils/pagination.util';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private readonly categoriesRepository: Repository<ProductCategory>,
    @InjectRepository(Supplier)
    private readonly suppliersRepository: Repository<Supplier>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private async buildEntity(dto: CreateProductDto | UpdateProductDto) {
    const category = dto.categoryId
      ? await this.categoriesRepository.findOne({
          where: { id: dto.categoryId },
        })
      : null;
    if (dto.categoryId && !category) {
      throw new NotFoundException('Categoría de producto no encontrada');
    }

    const supplier = dto.mainSupplierId
      ? await this.suppliersRepository.findOne({
          where: { id: dto.mainSupplierId },
        })
      : null;
    if (dto.mainSupplierId && !supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return { category, supplier };
  }

  async create(dto: CreateProductDto, actor: string): Promise<Product> {
    const exists = await this.productsRepository.findOne({
      where: { internalCode: dto.internalCode.trim() },
    });
    if (exists) {
      throw new BadRequestException('El código interno ya existe');
    }

    const { category, supplier } = await this.buildEntity(dto);
    if (!category) {
      throw new BadRequestException('La categoría es obligatoria');
    }

    const product = this.productsRepository.create({
      ...dto,
      category,
      mainSupplier: supplier,
      internalCode: dto.internalCode.trim(),
      active: dto.active ?? true,
      stock: dto.stock ?? null,
      model: dto.model ?? null,
      imageUrl: dto.imageUrl ?? null,
    });

    const savedProduct = await this.productsRepository.save(product);
    await this.auditLogsService.register({
      module: 'products',
      entity: 'Product',
      entityId: savedProduct.id,
      action: 'CREATE',
      user: actor,
      summary: `Producto creado: ${savedProduct.name}`,
      payloadSummary: dto,
    });
    return savedProduct;
  }

  findAll(): Promise<Product[]> {
    return this.productsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findAllPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Product>> {
    const { page, limit, skip } = resolvePagination(query, 10);
    const [items, total] = await this.productsRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return buildPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return product;
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    actor: string,
  ): Promise<Product> {
    const product = await this.findOne(id);

    if (dto.internalCode && dto.internalCode !== product.internalCode) {
      const exists = await this.productsRepository.findOne({
        where: { internalCode: dto.internalCode.trim() },
      });
      if (exists) {
        throw new BadRequestException('El código interno ya existe');
      }
    }

    const { category, supplier } = await this.buildEntity(dto);
    Object.assign(product, {
      ...dto,
      internalCode: dto.internalCode?.trim() ?? product.internalCode,
      category: category ?? product.category,
      mainSupplier:
        dto.mainSupplierId !== undefined ? supplier : product.mainSupplier,
      model: dto.model !== undefined ? dto.model : product.model,
      stock: dto.stock !== undefined ? dto.stock : product.stock,
      imageUrl: dto.imageUrl !== undefined ? dto.imageUrl : product.imageUrl,
    });

    const savedProduct = await this.productsRepository.save(product);
    await this.auditLogsService.register({
      module: 'products',
      entity: 'Product',
      entityId: savedProduct.id,
      action: 'UPDATE',
      user: actor,
      summary: `Producto actualizado: ${savedProduct.name}`,
      payloadSummary: dto,
    });
    return savedProduct;
  }

  async remove(id: string, actor: string): Promise<void> {
    const product = await this.findOne(id);
    const productId = product.id;
    try {
      await this.productsRepository.remove(product);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23503'
      ) {
        throw new BadRequestException(
          'No se puede eliminar el producto porque está relacionado con otros registros.',
        );
      }
      throw error;
    }

    await this.auditLogsService.register({
      module: 'products',
      entity: 'Product',
      entityId: productId,
      action: 'DELETE',
      user: actor,
      summary: `Producto eliminado: ${product.name}`,
    });
  }
}
