import { Expose, Type } from "class-transformer";
import { Race, CharacterClass, Alignment, AbilityName, NPCRole } from "./types";

export class AbilityScoresResponseDto {
  @Expose()
  id!: string;

  @Expose()
  strength!: number;

  @Expose()
  dexterity!: number;

  @Expose()
  constitution!: number;

  @Expose()
  intelligence!: number;

  @Expose()
  wisdom!: number;

  @Expose()
  charisma!: number;
}

export class SkillProficiencyResponseDto {
  @Expose()
  id!: string;

  @Expose()
  skill!: string;

  @Expose()
  proficient!: boolean;

  @Expose()
  expertise!: boolean;
}

export class HitPointsResponseDto {
  @Expose()
  max!: number;

  @Expose()
  current!: number;

  @Expose()
  temporary!: number;
}

export class SpellcastingResponseDto {
  @Expose()
  class!: string;

  @Expose()
  saveDC!: number;

  @Expose()
  attackBonus!: number;

  @Expose()
  knownSpells!: string[];

  @Expose()
  preparedSpells!: string[];

  @Expose()
  slots!: Record<number, number>;
}

export class CurrencyResponseDto {
  @Expose()
  cp!: number;

  @Expose()
  sp!: number;

  @Expose()
  ep!: number;

  @Expose()
  gp!: number;

  @Expose()
  pp!: number;
}

export class AppearanceResponseDto {
  @Expose()
  age?: number;

  @Expose()
  height?: string;

  @Expose()
  weight?: number;

  @Expose()
  eyes?: string;

  @Expose()
  skin?: string;

  @Expose()
  hair?: string;
}

export class MulticlassResponseDto {
  @Expose()
  id!: string;

  @Expose()
  class!: CharacterClass;

  @Expose()
  level!: number;
}

export class CharacterResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  race!: Race;

  @Expose()
  subrace?: string;

  @Expose()
  @Type(() => MulticlassResponseDto)
  multiclasses!: MulticlassResponseDto[];

  @Expose()
  level!: number;

  @Expose()
  background?: string;

  @Expose()
  alignment?: Alignment;

  @Expose()
  experiencePoints!: number;

  @Expose()
  inspiration!: boolean;

  @Expose()
  @Type(() => AbilityScoresResponseDto)
  abilityScores?: AbilityScoresResponseDto;

  @Expose()
  @Type(() => SkillProficiencyResponseDto)
  skillProficiencies!: SkillProficiencyResponseDto[];

  @Expose()
  savingThrows?: Record<string, boolean>;

  @Expose()
  proficiencyBonus!: number;

  @Expose()
  hitDice?: string;

  @Expose()
  @Type(() => HitPointsResponseDto)
  hitPoints!: HitPointsResponseDto;

  @Expose()
  armorClass!: number;

  @Expose()
  initiative!: number;

  @Expose()
  speed!: number;

  @Expose()
  @Type(() => SpellcastingResponseDto)
  spellcasting?: SpellcastingResponseDto;

  @Expose()
  featuresTraits!: string[];

  @Expose()
  personalityTraits?: string;

  @Expose()
  ideals?: string;

  @Expose()
  bonds?: string;

  @Expose()
  flaws?: string;

  @Expose()
  @Type(() => AppearanceResponseDto)
  appearance?: AppearanceResponseDto;

  @Expose()
  backstory?: string;

  @Expose()
  languages!: string[];

  @Expose()
  @Type(() => CurrencyResponseDto)
  currency!: CurrencyResponseDto;

  @Expose()
  ownerId?: string;

  @Expose()
  campaignId?: string;

  @Expose()
  isNPC!: boolean;

  @Expose()
  npcRole?: NPCRole;

  @Expose()
  challengeRating?: number;

  @Expose()
  lootTable?: any;

  @Expose()
  knownSpells!: string[];

  @Expose()
  preparedSpells!: string[];

  @Expose()
  avatarUrl?: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
