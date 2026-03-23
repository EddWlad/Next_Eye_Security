import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Maintenance } from './maintenance.entity';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { Client } from '../clients/client.entity';
import { User } from '../users/user.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Maintenance, Client, User]),
    AuditLogsModule,
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [TypeOrmModule],
})
export class MaintenanceModule {}
