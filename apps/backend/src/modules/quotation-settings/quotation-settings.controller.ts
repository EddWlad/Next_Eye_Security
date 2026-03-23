import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { QuotationSettingsService } from './quotation-settings.service';
import { UpdateQuotationSettingDto } from './dto/update-quotation-setting.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('quotation-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuotationSettingsController {
  constructor(private readonly settingsService: QuotationSettingsService) {}

  @Get()
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  getSettings() {
    return this.settingsService.getCurrentSettings();
  }

  @Patch()
  @Roles(Role.ADMINISTRADOR)
  updateSettings(
    @Body() dto: UpdateQuotationSettingDto,
    @Req() req: { user: { email: string } },
  ) {
    return this.settingsService.updateSettings(dto, req.user.email);
  }
}
