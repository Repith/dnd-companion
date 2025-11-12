import { z } from "zod";
import { Race, CharacterClass, Alignment, SkillName } from "@/types/character";

// Base schemas for nested objects
const abilityScoresSchema = z.object({
  strength: z.number().min(3).max(20),
  dexterity: z.number().min(3).max(20),
  constitution: z.number().min(3).max(20),
  intelligence: z.number().min(3).max(20),
  wisdom: z.number().min(3).max(20),
  charisma: z.number().min(3).max(20),
});

const skillProficiencySchema = z.object({
  skill: z.nativeEnum(SkillName),
  proficient: z.boolean(),
  expertise: z.boolean(),
});

const hitPointsSchema = z.object({
  max: z.number().min(1),
  current: z.number().min(0),
  temporary: z.number().min(0),
});

const currencySchema = z.object({
  cp: z.number().min(0),
  sp: z.number().min(0),
  ep: z.number().min(0),
  gp: z.number().min(0),
  pp: z.number().min(0),
});

const appearanceSchema = z.object({
  age: z.number().min(1).optional(),
  height: z.string().optional(),
  weight: z.number().min(1).optional(),
  eyes: z.string().optional(),
  skin: z.string().optional(),
  hair: z.string().optional(),
});

// Step 1: Basic Info
export const characterBasicInfoSchema = z.object({
  name: z.string().min(1, "Character name is required").max(50),
  race: z.nativeEnum(Race),
  subrace: z.string().optional(),
  class: z.nativeEnum(CharacterClass),
  level: z.number().min(1).max(20),
  background: z.string().optional(),
  alignment: z.nativeEnum(Alignment).optional(),
});

// Step 2: Ability Scores
export const characterAbilityScoresSchema = z.object({
  abilityScores: abilityScoresSchema,
});

// Step 3: Skills and Proficiencies
export const characterSkillsSchema = z.object({
  skillProficiencies: z.array(skillProficiencySchema).length(18),
  savingThrows: z.record(z.string(), z.boolean()),
});

// Step 4: Combat Stats
export const characterCombatSchema = z.object({
  hitPoints: hitPointsSchema,
  armorClass: z.number().min(5).max(25),
  initiative: z.number().min(0),
  speed: z.number().min(5).max(120),
});

// Step 5: Background and Personality
export const characterBackgroundSchema = z.object({
  personalityTraits: z.string().optional(),
  ideals: z.string().optional(),
  bonds: z.string().optional(),
  flaws: z.string().optional(),
  backstory: z.string().optional(),
  appearance: appearanceSchema.optional(),
  languages: z.array(z.string()).min(1),
});

// Step 6: Equipment and Currency
export const characterEquipmentSchema = z.object({
  currency: currencySchema,
  featuresTraits: z.array(z.string()),
});

// Complete character creation schema
export const createCharacterSchema = z.object({
  name: z.string().min(1).max(50),
  race: z.nativeEnum(Race),
  subrace: z.string().optional(),
  class: z.nativeEnum(CharacterClass),
  multiclasses: z
    .array(
      z.object({
        class: z.nativeEnum(CharacterClass),
        level: z.number().min(1).max(20),
      }),
    )
    .optional(),
  level: z.number().min(1).max(20),
  background: z.string().optional(),
  alignment: z.nativeEnum(Alignment).optional(),
  experiencePoints: z.number().min(0),
  inspiration: z.boolean(),
  abilityScores: abilityScoresSchema,
  skillProficiencies: z.array(skillProficiencySchema).length(18),
  savingThrows: z.record(z.string(), z.boolean()),
  hitPoints: hitPointsSchema,
  armorClass: z.number().min(5).max(25),
  initiative: z.number().min(0),
  speed: z.number().min(5).max(120),
  spellcasting: z
    .object({
      class: z.string(),
      saveDC: z.number().min(8).max(20),
      attackBonus: z.number().min(-5).max(10),
      knownSpells: z.array(z.string()),
      preparedSpells: z.array(z.string()),
      slots: z.record(z.string(), z.number()),
    })
    .optional(),
  featuresTraits: z.array(z.string()),
  personalityTraits: z.string().optional(),
  ideals: z.string().optional(),
  bonds: z.string().optional(),
  flaws: z.string().optional(),
  appearance: appearanceSchema.optional(),
  backstory: z.string().optional(),
  languages: z.array(z.string()).min(1),
  currency: currencySchema,
  ownerId: z.string().optional(),
  campaignId: z.string().optional(),
});

// Update character schema (all fields optional)
export const updateCharacterSchema = createCharacterSchema.partial();

// Dice roll schema
export const diceRollSchema = z.object({
  dice: z.string().regex(/^\d+d\d+$/, "Invalid dice format (e.g., 1d20)"),
  modifier: z.number().optional(),
});

// Death saves schema
export const deathSavesSchema = z.object({
  successes: z.number().min(0).max(3),
  failures: z.number().min(0).max(3),
});

// Type exports
export type CharacterBasicInfoFormData = z.infer<
  typeof characterBasicInfoSchema
>;
export type CharacterAbilityScoresFormData = z.infer<
  typeof characterAbilityScoresSchema
>;
export type CharacterSkillsFormData = z.infer<typeof characterSkillsSchema>;
export type CharacterCombatFormData = z.infer<typeof characterCombatSchema>;
export type CharacterBackgroundFormData = z.infer<
  typeof characterBackgroundSchema
>;
export type CharacterEquipmentFormData = z.infer<
  typeof characterEquipmentSchema
>;
export type CreateCharacterFormData = z.infer<typeof createCharacterSchema>;
export type UpdateCharacterFormData = z.infer<typeof updateCharacterSchema>;
export type DiceRollFormData = z.infer<typeof diceRollSchema>;
export type DeathSavesFormData = z.infer<typeof deathSavesSchema>;
