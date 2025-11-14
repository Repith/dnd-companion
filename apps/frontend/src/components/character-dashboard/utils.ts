// character-dashboard/utils/characterMath.ts
import { AbilityName, CharacterResponseDto } from "@/types/character";

export const calculateProficiencyBonus = (level: number): number =>
  Math.ceil(level / 4) + 1;

export const calculateModifier = (score: number): number =>
  Math.floor((score - 10) / 2);

export const getModifierDisplay = (modifier: number): string =>
  modifier >= 0 ? `+${modifier}` : modifier.toString();

export const SKILL_TO_ABILITY: Record<string, AbilityName> = {
  ACROBATICS: AbilityName.DEXTERITY,
  ANIMAL_HANDLING: AbilityName.WISDOM,
  ARCANA: AbilityName.INTELLIGENCE,
  ATHLETICS: AbilityName.STRENGTH,
  DECEPTION: AbilityName.CHARISMA,
  HISTORY: AbilityName.INTELLIGENCE,
  INSIGHT: AbilityName.WISDOM,
  INTIMIDATION: AbilityName.CHARISMA,
  INVESTIGATION: AbilityName.INTELLIGENCE,
  MEDICINE: AbilityName.WISDOM,
  NATURE: AbilityName.INTELLIGENCE,
  PERCEPTION: AbilityName.WISDOM,
  PERFORMANCE: AbilityName.CHARISMA,
  PERSUASION: AbilityName.CHARISMA,
  RELIGION: AbilityName.INTELLIGENCE,
  SLEIGHT_OF_HAND: AbilityName.DEXTERITY,
  STEALTH: AbilityName.DEXTERITY,
  SURVIVAL: AbilityName.WISDOM,
};

export const ABILITY_SKILLS: Record<AbilityName, string[]> = {
  STRENGTH: [],
  DEXTERITY: [],
  CONSTITUTION: [],
  INTELLIGENCE: [],
  WISDOM: [],
  CHARISMA: [],
};

for (const [skill, ability] of Object.entries(SKILL_TO_ABILITY)) {
  ABILITY_SKILLS[ability].push(skill);
}

export const getSkillModifier = (
  character: CharacterResponseDto,
  skillName: string,
  proficiencyBonus: number,
): number => {
  const ability: AbilityName =
    SKILL_TO_ABILITY[skillName] ?? AbilityName.STRENGTH;

  const abilityScore =
    character.abilityScores?.[
      ability.toLowerCase() as keyof NonNullable<
        CharacterResponseDto["abilityScores"]
      >
    ] ?? 10;

  const baseModifier = calculateModifier(Number(abilityScore));

  const skill = character.skillProficiencies.find(
    (s) => s.skill === skillName,
  ) ?? {
    proficient: false,
    expertise: false,
  };

  const proficiencyMultiplier = skill.expertise ? 2 : skill.proficient ? 1 : 0;

  return baseModifier + proficiencyMultiplier * proficiencyBonus;
};

export const getSavingThrowModifier = (
  character: CharacterResponseDto,
  ability: AbilityName,
  proficiencyBonus: number,
): number => {
  const abilityScore =
    character.abilityScores?.[
      ability.toLowerCase() as keyof NonNullable<
        CharacterResponseDto["abilityScores"]
      >
    ] ?? 10;

  const baseModifier = calculateModifier(Number(abilityScore));
  const isProficient =
    character.savingThrows?.[
      ability.toLowerCase() as keyof NonNullable<
        CharacterResponseDto["savingThrows"]
      >
    ];

  return baseModifier + (isProficient ? proficiencyBonus : 0);
};

export const formatEnumLabel = (value?: string | null): string => {
  if (!value) return "";
  return value
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
};
