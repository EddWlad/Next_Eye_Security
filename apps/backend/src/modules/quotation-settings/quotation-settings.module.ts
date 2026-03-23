import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotationSetting } from './quotation-setting.entity';
import { QuotationSettingsController } from './quotation-settings.controller';
import { QuotationSettingsService } from './quotation-settings.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([QuotationSetting]), AuditLogsModule],
  controllers: [QuotationSettingsController],
  providers: [QuotationSettingsService],
  exports: [QuotationSettingsService, TypeOrmModule],
})
export class QuotationSettingsModule {}
