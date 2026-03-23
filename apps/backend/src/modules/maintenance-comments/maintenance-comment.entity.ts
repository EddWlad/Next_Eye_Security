import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Maintenance } from '../maintenance/maintenance.entity';
import { User } from '../users/user.entity';

@Entity('maintenance_comments')
export class MaintenanceComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Maintenance, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'maintenance_id' })
  maintenance: Maintenance;

  @ManyToOne(() => User, { eager: true, nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  comment: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
