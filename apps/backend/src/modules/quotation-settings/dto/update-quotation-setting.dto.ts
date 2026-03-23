import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
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
  @IsIn(['0', '10', '12', '20', '25', '30'], { each: true })
  allowedMargins?: string[];

  @IsOptional()
  @IsNumberString()
  @IsIn(['0', '10', '12', '20', '25', '30'])
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
