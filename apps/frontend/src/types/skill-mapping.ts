import { AbilityName, SkillName } from "@/types/character";

export const SKILLS_BY_ABILITY: Record<
  AbilityName,
  { key: SkillName; label: string }[]
> = {
  [AbilityName.STRENGTH]: [{ key: SkillName.ATHLETICS, label: "Athletics" }],
  [AbilityName.DEXTERITY]: [
    { key: SkillName.ACROBATICS, label: "Acrobatics" },
    { key: SkillName.SLEIGHT_OF_HAND, label: "Sleight of Hand" },
    { key: SkillName.STEALTH, label: "Stealth" },
  ],
  [AbilityName.CONSTITUTION]: [],
  [AbilityName.INTELLIGENCE]: [
    { key: SkillName.ARCANA, label: "Arcana" },
    { key: SkillName.HISTORY, label: "History" },
    { key: SkillName.INVESTIGATION, label: "Investigation" },
    { key: SkillName.NATURE, label: "Nature" },
    { key: SkillName.RELIGION, label: "Religion" },
  ],
  [AbilityName.WISDOM]: [
    { key: SkillName.ANIMAL_HANDLING, label: "Animal Handling" },
    { key: SkillName.INSIGHT, label: "Insight" },
    { key: SkillName.MEDICINE, label: "Medicine" },
    { key: SkillName.PERCEPTION, label: "Perception" },
    { key: SkillName.SURVIVAL, label: "Survival" },
  ],
  [AbilityName.CHARISMA]: [
    { key: SkillName.DECEPTION, label: "Deception" },
    { key: SkillName.INTIMIDATION, label: "Intimidation" },
    { key: SkillName.PERFORMANCE, label: "Performance" },
    { key: SkillName.PERSUASION, label: "Persuasion" },
  ],
};
