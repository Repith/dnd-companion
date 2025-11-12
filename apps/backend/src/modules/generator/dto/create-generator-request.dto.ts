import { IsEnum, IsOptional, IsString, IsArray } from "class-validator";
import { GeneratorType } from "./types";

export class CreateGeneratorRequestDto {
  @IsEnum(GeneratorType)
  type!: GeneratorType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  prompt?: string;
}
