export enum Race {
  HUMAN = "HUMAN",
  ELF = "ELF",
  DWARF = "DWARF",
  HALFLING = "HALFLING",
  DRAGONBORN = "DRAGONBORN",
  GNOME = "GNOME",
  HALF_ELF = "HALF_ELF",
  HALF_ORC = "HALF_ORC",
  TIEFLING = "TIEFLING",
  AASIMAR = "AASIMAR",
  GENASI = "GENASI",
  TABAXI = "TABAXI",
  TORTLE = "TORTLE",
}

export enum CharacterClass {
  BARBARIAN = "BARBARIAN",
  BARD = "BARD",
  CLERIC = "CLERIC",
  DRUID = "DRUID",
  FIGHTER = "FIGHTER",
  MONK = "MONK",
  PALADIN = "PALADIN",
  RANGER = "RANGER",
  ROGUE = "ROGUE",
  SORCERER = "SORCERER",
  WARLOCK = "WARLOCK",
  WIZARD = "WIZARD",
  ARTIFICER = "ARTIFICER",
}

export enum Alignment {
  LAWFUL_GOOD = "LAWFUL_GOOD",
  NEUTRAL_GOOD = "NEUTRAL_GOOD",
  CHAOTIC_GOOD = "CHAOTIC_GOOD",
  LAWFUL_NEUTRAL = "LAWFUL_NEUTRAL",
  TRUE_NEUTRAL = "TRUE_NEUTRAL",
  CHAOTIC_NEUTRAL = "CHAOTIC_NEUTRAL",
  LAWFUL_EVIL = "LAWFUL_EVIL",
  NEUTRAL_EVIL = "NEUTRAL_EVIL",
  CHAOTIC_EVIL = "CHAOTIC_EVIL",
}

export enum SkillName {
  ACROBATICS = "ACROBATICS",
  ANIMAL_HANDLING = "ANIMAL_HANDLING",
  ARCANA = "ARCANA",
  ATHLETICS = "ATHLETICS",
  DECEPTION = "DECEPTION",
  HISTORY = "HISTORY",
  INSIGHT = "INSIGHT",
  INTIMIDATION = "INTIMIDATION",
  INVESTIGATION = "INVESTIGATION",
  MEDICINE = "MEDICINE",
  NATURE = "NATURE",
  PERCEPTION = "PERCEPTION",
  PERFORMANCE = "PERFORMANCE",
  PERSUASION = "PERSUASION",
  RELIGION = "RELIGION",
  SLEIGHT_OF_HAND = "SLEIGHT_OF_HAND",
  STEALTH = "STEALTH",
  SURVIVAL = "SURVIVAL",
}

export enum AbilityName {
  STRENGTH = "STRENGTH",
  DEXTERITY = "DEXTERITY",
  CONSTITUTION = "CONSTITUTION",
  INTELLIGENCE = "INTELLIGENCE",
  WISDOM = "WISDOM",
  CHARISMA = "CHARISMA",
}

export enum NPCRole {
  MERCHANT = "MERCHANT",
  ALLY = "ALLY",
  ENEMY = "ENEMY",
  QUEST_GIVER = "QUEST_GIVER",
  VILLAIN = "VILLAIN",
}

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
