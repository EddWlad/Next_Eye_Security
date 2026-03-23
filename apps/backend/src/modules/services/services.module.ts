import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './service.entity';
import { ServiceCategory } from '../service-categories/service-category.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, ServiceCategory]),
    AuditLogsModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [TypeOrmModule],
})
export class ServicesModule {}
