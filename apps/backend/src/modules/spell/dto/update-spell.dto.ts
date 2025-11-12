import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsObject,
} from "class-validator";
import { SpellSchool, SpellComponents, SpellDuration } from "./types";

export class UpdateSpellDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9)
  level?: number;

  @IsOptional()
  @IsEnum(SpellSchool)
  school?: SpellSchool;

  @IsOptional()
  @IsString()
  castingTime?: string;

  @IsOptional()
  @IsString()
  range?: string;

  @IsOptional()
  @IsObject()
  components?: SpellComponents;

  @IsOptional()
  @IsObject()
  duration?: SpellDuration;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classes?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  higherLevel?: string;
}
