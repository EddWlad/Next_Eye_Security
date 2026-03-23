import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from './attachment.entity';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { Maintenance } from '../maintenance/maintenance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attachment, Maintenance]), AuditLogsModule],
  controllers: [AttachmentsController],
  providers: [AttachmentsService],
  exports: [TypeOrmModule],
})
export class AttachmentsModule {}
