import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuotationSetting } from './quotation-setting.entity';
import { UpdateQuotationSettingDto } from './dto/update-quotation-setting.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class QuotationSettingsService {
  constructor(
    @InjectRepository(QuotationSetting)
    private readonly settingsRepository: Repository<QuotationSetting>,
    private readonly auditLogsService: AuditLogsService,
  ) { }

  async getCurrentSettings(): Promise<QuotationSetting> {
    const settingsRows = await this.settingsRepository.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    let settings = settingsRows[0];

    if (!settings) {
      settings = this.settingsRepository.create({
        currentVat: '15',
        allowedVatRates: ['0', '1', '12', '15'],
        allowedMargins: ['0', '10', '12', '20', '25', '30'],
        defaultMargin: '20',
        defaultCurrency: 'USD',
        defaultValidityDays: 15,
      });
      settings = await this.settingsRepository.save(settings);
    }

    return settings;
  }

  async updateSettings(
    dto: UpdateQuotationSettingDto,
    actor: string,
  ): Promise<QuotationSetting> {
    const settings = await this.getCurrentSettings();

    Object.assign(settings, {
      ...dto,
      currentVat: dto.currentVat ?? settings.currentVat,
      allowedVatRates: dto.allowedVatRates ?? settings.allowedVatRates,
      allowedMargins: dto.allowedMargins ?? settings.allowedMargins,
      defaultMargin: dto.defaultMargin ?? settings.defaultMargin,
      defaultCurrency:
        dto.defaultCurrency?.toUpperCase() ?? settings.defaultCurrency,
    });

    const savedSettings = await this.settingsRepository.save(settings);
    await this.auditLogsService.register({
      module: 'quotation-settings',
      entity: 'QuotationSetting',
      entityId: savedSettings.id,
      action: 'UPDATE',
      user: actor,
      summary: 'Parámetros de cotización actualizados',
      payloadSummary: dto,
    });
    return savedSettings;
  }
}
