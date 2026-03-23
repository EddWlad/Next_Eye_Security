import { IsNumberString, IsString, MaxLength } from 'class-validator';

export class CreateAttachmentDto {
  @IsString()
  @MaxLength(80)
  sourceEntity: string;

  @IsString()
  @MaxLength(80)
  sourceEntityId: string;

  @IsString()
  originalName: string;

  @IsString()
  storedName: string;

  @IsString()
  @MaxLength(120)
  mimeType: string;

  @IsString()
  storagePath: string;

  @IsNumberString()
  size: string;
}
