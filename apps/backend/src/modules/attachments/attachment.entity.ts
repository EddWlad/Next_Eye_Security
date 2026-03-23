import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80 })
  sourceEntity: string;

  @Column({ type: 'varchar', length: 80 })
  sourceEntityId: string;

  @Column({ type: 'varchar', length: 255 })
  originalName: string;

  @Column({ type: 'varchar', length: 255 })
  storedName: string;

  @Column({ type: 'varchar', length: 120 })
  mimeType: string;

  @Column({ type: 'varchar', length: 255 })
  storagePath: string;

  @Column({ type: 'bigint' })
  size: string;

  @Column({ type: 'varchar', length: 180 })
  uploadedBy: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
