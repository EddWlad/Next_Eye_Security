import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { ProductCategoriesModule } from './modules/product-categories/product-categories.module';
import { ProductsModule } from './modules/products/products.module';
import { ServiceCategoriesModule } from './modules/service-categories/service-categories.module';
import { ServicesModule } from './modules/services/services.module';
import { QuotationSettingsModule } from './modules/quotation-settings/quotation-settings.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { MaintenanceCommentsModule } from './modules/maintenance-comments/maintenance-comments.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        databaseConfig(configService),
    }),
    AuthModule,
    UsersModule,
    ClientsModule,
    SuppliersModule,
    ProductCategoriesModule,
    ProductsModule,
    ServiceCategoriesModule,
    ServicesModule,
    QuotationSettingsModule,
    QuotationsModule,
    MaintenanceModule,
    MaintenanceCommentsModule,
    AttachmentsModule,
    AuditLogsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
