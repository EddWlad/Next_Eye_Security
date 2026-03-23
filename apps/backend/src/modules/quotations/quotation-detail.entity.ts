import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Quotation } from './quotation.entity';
import { QuotationItemType } from '../../common/enums/quotation.enums';

@Entity('quotation_details')
export class QuotationDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Quotation, (quotation) => quotation.details, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quotation_id' })
  quotation: Quotation;

  @Column({ type: 'enum', enum: QuotationItemType })
  itemType: QuotationItemType;

  @Column({ type: 'varchar', length: 80 })
  referenceId: string;

  @Column({ type: 'varchar', length: 255 })
  descriptionFrozen: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  quantity: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  basePriceHistorical: string;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  vatPercentHistorical: string;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  marginPercentHistorical: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  unitPriceFinal: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  lineSubtotalBase: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  lineVatValue: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  lineTotal: string;
}
