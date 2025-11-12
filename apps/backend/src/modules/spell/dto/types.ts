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
  [key: string]: any;
}

export interface SpellDuration {
  duration: string;
  concentration?: boolean;
  [key: string]: any;
}
