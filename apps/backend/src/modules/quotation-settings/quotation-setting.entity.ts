import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('quotation_settings')
export class QuotationSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: '15.00' })
  currentVat: string;

  @Column({ type: 'simple-array', default: '0,1,12,15' })
  allowedVatRates: string[];

  @Column({ type: 'simple-array', default: '0,10,12,20,25,30' })
  allowedMargins: string[];

  @Column({ type: 'numeric', precision: 5, scale: 2, default: '20.00' })
  defaultMargin: string;

  @Column({ type: 'varchar', length: 8, default: 'USD' })
  defaultCurrency: string;

  @Column({ type: 'int', default: 15 })
  defaultValidityDays: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
