import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quotation } from './quotation.entity';
import { QuotationDetail } from './quotation-detail.entity';
import { QuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';
import { Client } from '../clients/client.entity';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';
import { Service } from '../services/service.entity';
import { QuotationSettingsModule } from '../quotation-settings/quotation-settings.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quotation,
      QuotationDetail,
      Client,
      User,
      Product,
      Service,
    ]),
    QuotationSettingsModule,
    AuditLogsModule,
  ],
  controllers: [QuotationsController],
  providers: [QuotationsService],
  exports: [TypeOrmModule],
})
export class QuotationsModule {}
