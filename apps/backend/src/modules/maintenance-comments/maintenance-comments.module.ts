import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceCommentsController } from './maintenance-comments.controller';
import { MaintenanceCommentsService } from './maintenance-comments.service';
import { MaintenanceComment } from './maintenance-comment.entity';
import { Maintenance } from '../maintenance/maintenance.entity';
import { User } from '../users/user.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MaintenanceComment, Maintenance, User]),
    AuditLogsModule,
  ],
  controllers: [MaintenanceCommentsController],
  providers: [MaintenanceCommentsService],
  exports: [TypeOrmModule],
})
export class MaintenanceCommentsModule {}
