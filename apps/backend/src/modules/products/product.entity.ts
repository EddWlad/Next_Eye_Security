import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductCategory } from '../product-categories/product-category.entity';
import { Supplier } from '../suppliers/supplier.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProductCategory, { eager: true, nullable: false })
  @JoinColumn({ name: 'category_id' })
  category: ProductCategory;

  @ManyToOne(() => Supplier, { eager: true, nullable: true })
  @JoinColumn({ name: 'main_supplier_id' })
  mainSupplier?: Supplier | null;

  @Column({ type: 'varchar', length: 80, unique: true })
  internalCode: string;

  @Column({ type: 'varchar', length: 180 })
  name: string;

  @Column({ type: 'varchar', length: 120 })
  brand: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  model?: string | null;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  baseCost: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  stock?: string | null;

  @Column({ type: 'varchar', length: 30 })
  unit: string;

  @Column({ type: 'text', nullable: true })
  imageUrl?: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
