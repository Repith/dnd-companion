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
 * Calculates the proficiency bonus based on character level.
 * Proficiency bonus increases every 4 levels: +2 at levels 1-4, +3 at 5-8, etc.
 */
export function calculateProficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
}

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
