/**
 * D&D 5e Constants and Rules
 * Centralized constants for game mechanics that can be made configurable
 */

export const EXPERIENCE_THRESHOLDS = [
  0, // Level 1
  300, // Level 2
  900, // Level 3
  2700, // Level 4
  6500, // Level 5
  14000, // Level 6
  23000, // Level 7
  34000, // Level 8
  48000, // Level 9
  64000, // Level 10
  85000, // Level 11
  100000, // Level 12
  120000, // Level 13
  140000, // Level 14
  165000, // Level 15
  195000, // Level 16
  225000, // Level 17
  265000, // Level 18
  305000, // Level 19
  355000, // Level 20
];

/**
 * Calculate proficiency bonus based on level
 */
export function calculateProficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
}

/**
 * Calculate ability modifier from score
 */
export function calculateAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Get hit die for a character class
 */
export const HIT_DICE: Record<string, number> = {
  BARBARIAN: 12,
  FIGHTER: 10,
  PALADIN: 10,
  RANGER: 10,
  BLOOD_HUNTER: 10,
  ARTIFICER: 8,
  BARD: 8,
  CLERIC: 8,
  DRUID: 8,
  MONK: 8,
  ROGUE: 8,
  WARLOCK: 8,
  SORCERER: 6,
  WIZARD: 6,
};

/**
 * Spellcasting classes
 */
export const SPELLCASTING_CLASSES = [
  "ARTIFICER",
  "BARD",
  "CLERIC",
  "DRUID",
  "PALADIN",
  "RANGER",
  "SORCERER",
  "WARLOCK",
  "WIZARD",
];

/**
 * Spellcasting ability for each class
 */
export const SPELLCASTING_ABILITY: Record<string, string> = {
  ARTIFICER: "INTELLIGENCE",
  BARD: "CHARISMA",
  CLERIC: "WISDOM",
  DRUID: "WISDOM",
  PALADIN: "CHARISMA",
  RANGER: "WISDOM",
  SORCERER: "CHARISMA",
  WARLOCK: "CHARISMA",
  WIZARD: "INTELLIGENCE",
};

/**
 * Calculate level from experience points
 */
export function calculateLevelFromExperience(experiencePoints: number): number {
  for (let level = 1; level <= 20; level++) {
    if (experiencePoints < EXPERIENCE_THRESHOLDS[level]) {
      return level;
    }
  }
  return 20; // Max level
}

/**
 * Get spell slots for a class and level (simplified table)
 */
export function getSpellSlots(
  characterClass: string,
  level: number,
): Record<number, number> {
  // Simplified spell slot table - this would need to be expanded for full D&D rules
  const slotTables: Record<string, Record<number, number[]>> = {
    WIZARD: {
      1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
      2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
      3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
      4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
      5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
      6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
      7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
      8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
      9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
      10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
      11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
      12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
      13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
      14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
      15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
      16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
      17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
      18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
      19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
      20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
    },
    // Add other spellcasting classes with their slot tables
    BARD: {
      1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
      2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
      3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
      // Add more levels...
    },
    // Add other classes...
  };

  const table = slotTables[characterClass] || slotTables["WIZARD"];
  const slots = table[level] || [0, 0, 0, 0, 0, 0, 0, 0, 0];

  return {
    1: slots[0],
    2: slots[1],
    3: slots[2],
    4: slots[3],
    5: slots[4],
    6: slots[5],
    7: slots[6],
    8: slots[7],
    9: slots[8],
  };
}

/**
 * Calculate spell save DC
 */
export function calculateSpellSaveDC(
  spellcastingAbilityModifier: number,
  proficiencyBonus: number,
): number {
  return 8 + spellcastingAbilityModifier + proficiencyBonus;
}

/**
 * Calculate spell attack bonus
 */
export function calculateSpellAttackBonus(
  spellcastingAbilityModifier: number,
  proficiencyBonus: number,
): number {
  return spellcastingAbilityModifier + proficiencyBonus;
}

/**
 * Scale quest XP based on character level and attributes
 */
export function scaleQuestXP(
  baseXP: number,
  characterLevel: number,
  characterAttributes: any,
): number {
  // Base scaling by level (higher level characters get less XP for same difficulty)
  const levelScaling = Math.max(0.5, 1 - (characterLevel - 1) * 0.05);

  // Bonus XP based on Wisdom modifier (perception/awareness)
  const wisdomModifier = calculateAbilityModifier(
    characterAttributes?.wisdom || 10,
  );
  const wisdomBonus = 1 + wisdomModifier * 0.1;

  // Bonus XP based on Intelligence modifier (problem-solving)
  const intelligenceModifier = calculateAbilityModifier(
    characterAttributes?.intelligence || 10,
  );
  const intelligenceBonus = 1 + intelligenceModifier * 0.05;

  return Math.round(baseXP * levelScaling * wisdomBonus * intelligenceBonus);
}

/**
 * Calculate dynamic loot distribution based on character attributes
 */
export function calculateLootDistribution(
  baseLoot: any[],
  characterLevel: number,
  characterAttributes: any,
): any[] {
  if (!Array.isArray(baseLoot)) return baseLoot;

  return baseLoot.map((loot) => {
    if (!loot || typeof loot !== "object") return loot;

    const { itemId, quantity, ...rest } = loot;

    // Scale quantity based on character attributes
    let scaledQuantity = quantity || 1;

    // Luck factor based on Charisma (social encounters)
    const charismaModifier = calculateAbilityModifier(
      characterAttributes?.charisma || 10,
    );
    const luckMultiplier = 1 + charismaModifier * 0.1;

    // Greed factor based on Intelligence (finding hidden loot)
    const intelligenceModifier = calculateAbilityModifier(
      characterAttributes?.intelligence || 10,
    );
    const greedMultiplier = 1 + intelligenceModifier * 0.05;

    scaledQuantity = Math.round(
      scaledQuantity * luckMultiplier * greedMultiplier,
    );

    return {
      itemId,
      quantity: Math.max(1, scaledQuantity), // Ensure at least 1 item
      ...rest,
    };
  });
}
