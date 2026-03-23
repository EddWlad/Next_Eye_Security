import { IsString, MaxLength } from 'class-validator';

export class UploadAttachmentFileDto {
  @IsString()
  @MaxLength(80)
  sourceEntity: string;

  @IsString()
  @MaxLength(80)
  sourceEntityId: string;
}
