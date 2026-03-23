import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { User } from '../users/user.entity';
import { QuotationStatus } from '../../common/enums/quotation.enums';
import { QuotationDetail } from './quotation-detail.entity';

@Entity('quotations')
export class Quotation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 40, unique: true })
  quotationNumber: string;

  @ManyToOne(() => Client, { eager: true, nullable: false })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: User;

  @Column({ type: 'date' })
  issuedAt: string;

  @Column({ type: 'date' })
  validUntil: string;

  @Column({
    type: 'enum',
    enum: QuotationStatus,
    default: QuotationStatus.BORRADOR,
  })
  status: QuotationStatus;

  @Column({ type: 'text', nullable: true })
  observations?: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  subtotal: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: '0.00' })
  discount: string;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  vatPercentHistorical: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  vatValueHistorical: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total: string;

  @Column({ type: 'varchar', length: 8, default: 'USD' })
  currency: string;

  @OneToMany(() => QuotationDetail, (detail) => detail.quotation, {
    eager: true,
    cascade: true,
  })
  details: QuotationDetail[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
