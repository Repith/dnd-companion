import { IsOptional, IsString } from "class-validator";

export class UpdateDMNoteDto {
  @IsOptional()
  @IsString()
  content?: string;
}
