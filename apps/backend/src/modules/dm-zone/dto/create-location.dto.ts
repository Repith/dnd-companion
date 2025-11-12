import { IsNotEmpty, IsOptional, IsString, IsEnum } from "class-validator";
import { LocationType } from "./types";

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(LocationType)
  type!: LocationType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  mapUrl?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
