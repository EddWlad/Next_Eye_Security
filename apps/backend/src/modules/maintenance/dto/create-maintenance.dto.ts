import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  MaintenanceStatus,
  MaintenanceType,
} from '../../../common/enums/maintenance.enums';

export class CreateMaintenanceDto {
  @IsString()
  clientId: string;

  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsDateString()
  scheduledDate: string;

  @IsOptional()
  @IsDateString()
  executionDate?: string;

  @IsOptional()
  @IsString()
  technicianId?: string;

  @IsString()
  intervenedSystem: string;

  @IsString()
  diagnosis: string;

  @IsString()
  appliedSolution: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
