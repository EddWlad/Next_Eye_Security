import { IsEnum } from 'class-validator';
import { QuotationStatus } from '../../../common/enums/quotation.enums';

export class UpdateQuotationStatusDto {
  @IsEnum(QuotationStatus)
  status: QuotationStatus;
}
