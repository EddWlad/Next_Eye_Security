import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { User } from '../users/user.entity';
import {
  MaintenanceStatus,
  MaintenanceType,
} from '../../common/enums/maintenance.enums';

@Entity('maintenance')
export class Maintenance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Client, { eager: true, nullable: false })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ type: 'enum', enum: MaintenanceType })
  type: MaintenanceType;

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.PENDIENTE,
  })
  status: MaintenanceStatus;

  @Column({ type: 'date' })
  scheduledDate: string;

  @Column({ type: 'date', nullable: true })
  executionDate?: string | null;

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: 'technician_id' })
  technician: User;

  @Column({ type: 'varchar', length: 255 })
  intervenedSystem: string;

  @Column({ type: 'text' })
  diagnosis: string;

  @Column({ type: 'text' })
  appliedSolution: string;

  @Column({ type: 'text', nullable: true })
  observations?: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
