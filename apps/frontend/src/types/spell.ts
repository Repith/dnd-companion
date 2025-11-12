export enum SpellSchool {
  ABJURATION = "ABJURATION",
  CONJURATION = "CONJURATION",
  DIVINATION = "DIVINATION",
  ENCHANTMENT = "ENCHANTMENT",
  EVOCATION = "EVOCATION",
  ILLUSION = "ILLUSION",
  NECROMANCY = "NECROMANCY",
  TRANSMUTATION = "TRANSMUTATION",
}

export interface SpellComponents {
  verbal?: boolean;
  somatic?: boolean;
  material?: string;
}

export interface SpellDuration {
  duration: string;
  concentration?: boolean;
}

export interface SpellResponseDto {
  id: string;
  name: string;
  level: number;
  school?: SpellSchool;
  castingTime?: string;
  range?: string;
  components?: SpellComponents;
  duration?: SpellDuration;
  classes: string[];
  description?: string;
  higherLevel?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSpellDto {
  name: string;
  level: number;
  school?: SpellSchool;
  castingTime?: string;
  range?: string;
  components?: SpellComponents;
  duration?: SpellDuration;
  classes: string[];
  description?: string;
  higherLevel?: string;
}

export interface UpdateSpellDto {
  name?: string;
  level?: number;
  school?: SpellSchool;
  castingTime?: string;
  range?: string;
  components?: SpellComponents;
  duration?: SpellDuration;
  classes?: string[];
  description?: string;
  higherLevel?: string;
}

export interface SpellFilters {
  level?: number;
  school?: SpellSchool;
  class?: string;
  search?: string;
}
