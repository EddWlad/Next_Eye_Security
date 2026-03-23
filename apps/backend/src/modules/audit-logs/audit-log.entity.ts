import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80 })
  module: string;

  @Column({ type: 'varchar', length: 80 })
  entity: string;

  @Column({ type: 'varchar', length: 80 })
  entityId: string;

  @Column({ type: 'varchar', length: 30 })
  action: string;

  @Column({ type: 'varchar', length: 180 })
  user: string;

  @Column({ type: 'varchar', length: 300 })
  summary: string;

  @Column({ type: 'text', nullable: true })
  payloadSummary?: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
