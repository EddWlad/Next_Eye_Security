import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @MaxLength(180)
  businessName: string;

  @IsString()
  @MaxLength(30)
  ruc: string;

  @IsString()
  @MaxLength(180)
  contact: string;

  @IsString()
  @MaxLength(30)
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MaxLength(255)
  address: string;

  @IsString()
  @MaxLength(120)
  city: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
