import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsObject,
  IsBoolean,
} from "class-validator";
import { SpellSchool, SpellComponents, SpellDuration } from "./types";

export class CreateSpellDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0)
  @Max(9)
  level!: number;

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

  @IsObject()
  duration!: SpellDuration;

  @IsArray()
  @IsString({ each: true })
  classes!: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  higherLevel?: string;
}
