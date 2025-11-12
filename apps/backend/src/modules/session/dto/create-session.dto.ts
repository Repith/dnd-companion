import { IsOptional, IsString, IsArray, IsUUID } from "class-validator";

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  playerCharacterIds?: string[];
}
