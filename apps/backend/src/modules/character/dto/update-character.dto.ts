import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsObject,
  ArrayMinSize,
  ArrayMaxSize,
} from "class-validator";
import { Type } from "class-transformer";
import {
  Race,
  CharacterClass,
  Alignment,
  SkillName,
  MulticlassDto,
} from "./types";
import {
  AbilityScoresDto,
  SkillProficiencyDto,
  HitPointsDto,
  SpellcastingDto,
  CurrencyDto,
  AppearanceDto,
} from "./create-character.dto";

export class UpdateCharacterDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEnum(Race)
  race?: Race;

  @IsOptional()
  @IsString()
  subrace?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  multiclasses?: MulticlassDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  level?: number;

  @IsOptional()
  @IsString()
  background?: string;

  @IsOptional()
  @IsEnum(Alignment)
  alignment?: Alignment;

  @IsOptional()
  @IsInt()
  @Min(0)
  experiencePoints?: number;

  @IsOptional()
  @IsBoolean()
  inspiration?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => AbilityScoresDto)
  abilityScores?: AbilityScoresDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillProficiencyDto)
  @ArrayMinSize(18)
  @ArrayMaxSize(18)
  skillProficiencies?: SkillProficiencyDto[];

  @IsOptional()
  @IsObject()
  savingThrows?: Record<string, boolean>;

  @IsOptional()
  @ValidateNested()
  @Type(() => HitPointsDto)
  hitPoints?: HitPointsDto;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(25)
  armorClass?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  initiative?: number;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  speed?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => SpellcastingDto)
  spellcasting?: SpellcastingDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featuresTraits?: string[];

  @IsOptional()
  @IsString()
  personalityTraits?: string;

  @IsOptional()
  @IsString()
  ideals?: string;

  @IsOptional()
  @IsString()
  bonds?: string;

  @IsOptional()
  @IsString()
  flaws?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AppearanceDto)
  appearance?: AppearanceDto;

  @IsOptional()
  @IsString()
  backstory?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CurrencyDto)
  currency?: CurrencyDto;

  @IsOptional()
  @IsString()
  campaignId?: string;
}
