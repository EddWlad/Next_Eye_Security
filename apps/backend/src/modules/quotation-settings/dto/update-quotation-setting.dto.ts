import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  Matches,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateQuotationSettingDto {
  @IsOptional()
  @IsNumberString()
  @IsIn(['0', '1', '12', '15'])
  currentVat?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['0', '1', '12', '15'], { each: true })
  allowedVatRates?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @Matches(/^\d+(\.\d+)?$/, { each: true })
  allowedMargins?: string[];

  @IsOptional()
  @IsNumberString()
  @Matches(/^\d+(\.\d+)?$/)
  defaultMargin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  defaultCurrency?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  defaultValidityDays?: number;
}
