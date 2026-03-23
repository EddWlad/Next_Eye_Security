import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  QuotationItemType,
  QuotationStatus,
} from '../../../common/enums/quotation.enums';

export class CreateQuotationItemDto {
  @IsEnum(QuotationItemType)
  itemType: QuotationItemType;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumberString()
  quantity: string;

  @IsOptional()
  @IsNumberString()
  @IsIn(['0', '1', '12', '15'])
  vatPercent?: string;

  @IsOptional()
  @IsNumberString()
  @IsIn(['0', '10', '12', '20', '25', '30'])
  marginPercent?: string;
}

export class CreateQuotationDto {
  @IsString()
  clientId: string;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsNumberString()
  discount?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items: CreateQuotationItemDto[];
}
