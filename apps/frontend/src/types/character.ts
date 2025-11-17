import {
  Race,
  CharacterClass,
  Alignment,
  SkillName,
  AbilityName,
  NPCRole,
} from "@dnd-companion/domain";

// Re-export domain enums for backward compatibility
export { Race, CharacterClass, Alignment, SkillName, AbilityName, NPCRole };

export interface MulticlassDto {
  class: CharacterClass;
  level: number;
}

export interface AbilityScoresDto {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface SkillProficiencyDto {
  skill: SkillName;
  proficient: boolean;
  expertise: boolean;
}

export interface HitPointsDto {
  max: number;
  current: number;
  temporary: number;
}

export interface SpellcastingDto {
  class: string;
  saveDC: number;
  attackBonus: number;
  knownSpells: string[];
  preparedSpells: string[];
  slots: Record<number, number>;
}

export interface CurrencyDto {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

export interface AppearanceDto {
  age?: number;
  height?: string;
  weight?: number;
  eyes?: string;
  skin?: string;
  hair?: string;
}

export interface CreateCharacterDto {
  name: string;
  race: Race;
  subrace?: string;
  class: CharacterClass;
  multiclasses?: MulticlassDto[];
  level: number;
  background?: string;
  alignment?: Alignment;
  experiencePoints: number;
  inspiration: boolean;
  abilityScores: AbilityScoresDto;
  skillProficiencies: SkillProficiencyDto[];
  savingThrows: Record<string, boolean>;
  hitPoints: HitPointsDto;
  armorClass: number;
  initiative: number;
  speed: number;
  spellcasting?: SpellcastingDto;
  featuresTraits: string[];
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  appearance?: AppearanceDto;
  backstory?: string;
  languages: string[];
  currency: CurrencyDto;
  ownerId?: string;
  campaignId?: string;
}

export interface UpdateCharacterDto {
  name?: string;
  race?: Race;
  subrace?: string;
  class?: CharacterClass;
  multiclasses?: MulticlassDto[];
  level?: number;
  background?: string;
  alignment?: Alignment;
  experiencePoints?: number;
  inspiration?: boolean;
  abilityScores?: AbilityScoresDto;
  skillProficiencies?: SkillProficiencyDto[];
  savingThrows?: Record<string, boolean>;
  hitPoints?: HitPointsDto;
  armorClass?: number;
  initiative?: number;
  speed?: number;
  spellcasting?: SpellcastingDto;
  featuresTraits?: string[];
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  appearance?: AppearanceDto;
  backstory?: string;
  languages?: string[];
  currency?: CurrencyDto;
  campaignId?: string;
}

export interface AbilityScoresResponseDto {
  id: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface SkillProficiencyResponseDto {
  id: string;
  skill: string;
  proficient: boolean;
  expertise: boolean;
}

export interface HitPointsResponseDto {
  max: number;
  current: number;
  temporary: number;
}

export interface SpellcastingResponseDto {
  class: string;
  saveDC: number;
  attackBonus: number;
  knownSpells: string[];
  preparedSpells: string[];
  slots: Record<number, number>;
  remainingSlots?: Record<number, number>;
}

export interface CurrencyResponseDto {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

export interface AppearanceResponseDto {
  age?: number;
  height?: string;
  weight?: number;
  eyes?: string;
  skin?: string;
  hair?: string;
}

export interface MulticlassResponseDto {
  id: string;
  class: CharacterClass;
  level: number;
}

export interface CharacterResponseDto {
  id: string;
  name: string;
  race: Race;
  subrace?: string;
  multiclasses: MulticlassResponseDto[];
  level: number;
  background?: string;
  alignment?: Alignment;
  experiencePoints: number;
  inspiration: boolean;
  abilityScores?: AbilityScoresResponseDto;
  skillProficiencies: SkillProficiencyResponseDto[];
  savingThrows?: Record<string, boolean>;
  proficiencyBonus: number;
  hitDice?: string;
  hitPoints: HitPointsResponseDto;
  armorClass: number;
  initiative: number;
  speed: number;
  spellcasting?: SpellcastingResponseDto;
  featuresTraits: string[];
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  appearance?: AppearanceResponseDto;
  backstory?: string;
  languages: string[];
  currency: CurrencyResponseDto;
  ownerId?: string;
  campaignId?: string;
  isNPC: boolean;
  npcRole?: NPCRole;
  challengeRating?: number;
  lootTable?: any;
  knownSpells: string[];
  preparedSpells: string[];
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Additional types for frontend
export interface CharacterBuilderData extends Partial<CreateCharacterDto> {
  step: number;
}

export interface DiceRoll {
  dice: string;
  result: number;
  rolls: number[];
  modifier?: number;
  total: number;
}

export interface CreateDiceRollDto {
  diceType: string;
  numberOfDice: number;
  individualResults: number[];
  totalResult: number;
  characterId?: string;
}

export interface DiceRollResponseDto {
  id: string;
  userId: string;
  characterId?: string;
  diceType: string;
  numberOfDice: number;
  individualResults: number[];
  totalResult: number;
  timestamp: Date;
}

export interface DeathSaves {
  successes: number;
  failures: number;
}
