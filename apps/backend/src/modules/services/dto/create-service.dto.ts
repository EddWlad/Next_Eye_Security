import {
  IsBoolean,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  categoryId: string;

  @IsString()
  @MaxLength(180)
  name: string;

  @IsString()
  description: string;

  @IsNumberString()
  baseCost: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
