import {
  IsBoolean,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  mainSupplierId?: string;

  @IsString()
  @MaxLength(80)
  internalCode: string;

  @IsString()
  @MaxLength(180)
  name: string;

  @IsString()
  @MaxLength(120)
  brand: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  model?: string;

  @IsString()
  description: string;

  @IsNumberString()
  baseCost: string;

  @IsOptional()
  @IsNumberString()
  stock?: string;

  @IsString()
  @MaxLength(30)
  unit: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
