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

export class AbilityScoresDto {
  @IsInt()
  @Min(3)
  @Max(20)
  strength!: number;

  @IsInt()
  @Min(3)
  @Max(20)
  dexterity!: number;

  @IsInt()
  @Min(3)
  @Max(20)
  constitution!: number;

  @IsInt()
  @Min(3)
  @Max(20)
  intelligence!: number;

  @IsInt()
  @Min(3)
  @Max(20)
  wisdom!: number;

  @IsInt()
  @Min(3)
  @Max(20)
  charisma!: number;
}

export class SkillProficiencyDto {
  @IsEnum(SkillName)
  skill!: SkillName;

  @IsBoolean()
  proficient!: boolean;

  @IsBoolean()
  expertise!: boolean;
}

export class HitPointsDto {
  @IsInt()
  @Min(1)
  max!: number;

  @IsInt()
  @Min(0)
  current!: number;

  @IsInt()
  @Min(0)
  temporary!: number;
}

export class SpellcastingDto {
  @IsString()
  @IsNotEmpty()
  class!: string;

  @IsInt()
  @Min(8)
  @Max(20)
  saveDC!: number;

  @IsInt()
  @Min(-5)
  @Max(10)
  attackBonus!: number;

  @IsArray()
  @IsString({ each: true })
  knownSpells!: string[];

  @IsArray()
  @IsString({ each: true })
  preparedSpells!: string[];

  @IsObject()
  slots!: Record<number, number>;
}

export class CurrencyDto {
  @IsInt()
  @Min(0)
  cp!: number;

  @IsInt()
  @Min(0)
  sp!: number;

  @IsInt()
  @Min(0)
  ep!: number;

  @IsInt()
  @Min(0)
  gp!: number;

  @IsInt()
  @Min(0)
  pp!: number;
}

export class AppearanceDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  age?: number;

  @IsOptional()
  @IsString()
  height?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  weight?: number;

  @IsOptional()
  @IsString()
  eyes?: string;

  @IsOptional()
  @IsString()
  skin?: string;

  @IsOptional()
  @IsString()
  hair?: string;
}

export class CreateCharacterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(Race)
  race!: Race;

  @IsOptional()
  @IsString()
  subrace?: string;

  @IsOptional()
  @IsEnum(CharacterClass)
  class?: CharacterClass;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  multiclasses?: MulticlassDto[];

  @IsInt()
  @Min(1)
  @Max(20)
  level!: number;

  @IsOptional()
  @IsString()
  background?: string;

  @IsOptional()
  @IsEnum(Alignment)
  alignment?: Alignment;

  @IsInt()
  @Min(0)
  experiencePoints!: number;

  @IsBoolean()
  inspiration!: boolean;

  @ValidateNested()
  @Type(() => AbilityScoresDto)
  abilityScores!: AbilityScoresDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillProficiencyDto)
  @ArrayMinSize(18)
  @ArrayMaxSize(18)
  skillProficiencies!: SkillProficiencyDto[];

  @IsObject()
  savingThrows!: Record<string, boolean>;

  @ValidateNested()
  @Type(() => HitPointsDto)
  hitPoints!: HitPointsDto;

  @IsInt()
  @Min(5)
  @Max(25)
  armorClass!: number;

  @IsInt()
  @Min(0)
  initiative!: number;

  @IsInt()
  @Min(5)
  @Max(120)
  speed!: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => SpellcastingDto)
  spellcasting?: SpellcastingDto;

  @IsArray()
  @IsString({ each: true })
  featuresTraits!: string[];

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

  @IsArray()
  @IsString({ each: true })
  languages!: string[];

  @ValidateNested()
  @Type(() => CurrencyDto)
  currency!: CurrencyDto;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsBoolean()
  isNPC?: boolean;
}
