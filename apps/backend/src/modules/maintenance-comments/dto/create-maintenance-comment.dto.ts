import { IsString } from 'class-validator';

export class CreateMaintenanceCommentDto {
  @IsString()
  maintenanceId: string;

  @IsString()
  comment: string;
}
