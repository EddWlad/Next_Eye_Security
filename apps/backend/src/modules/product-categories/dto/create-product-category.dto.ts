import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProductCategoryDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
