"use client";

import { UseFormReturn } from "react-hook-form";
import { CreateCharacterFormData } from "@/lib/validations/character";
import { SkillName, AbilityName } from "@/types/character";

interface CharacterSkillsStepProps {
  form: UseFormReturn<CreateCharacterFormData>;
}

const SKILLS = [
  {
    name: SkillName.ACROBATICS,
    ability: AbilityName.DEXTERITY,
    display: "Acrobatics",
  },
  {
    name: SkillName.ANIMAL_HANDLING,
    ability: AbilityName.WISDOM,
    display: "Animal Handling",
  },
  {
    name: SkillName.ARCANA,
    ability: AbilityName.INTELLIGENCE,
    display: "Arcana",
  },
  {
    name: SkillName.ATHLETICS,
    ability: AbilityName.STRENGTH,
    display: "Athletics",
  },
  {
    name: SkillName.DECEPTION,
    ability: AbilityName.CHARISMA,
    display: "Deception",
  },
  {
    name: SkillName.HISTORY,
    ability: AbilityName.INTELLIGENCE,
    display: "History",
  },
  { name: SkillName.INSIGHT, ability: AbilityName.WISDOM, display: "Insight" },
  {
    name: SkillName.INTIMIDATION,
    ability: AbilityName.CHARISMA,
    display: "Intimidation",
  },
  {
    name: SkillName.INVESTIGATION,
    ability: AbilityName.INTELLIGENCE,
    display: "Investigation",
  },
  {
    name: SkillName.MEDICINE,
    ability: AbilityName.WISDOM,
    display: "Medicine",
  },
  {
    name: SkillName.NATURE,
    ability: AbilityName.INTELLIGENCE,
    display: "Nature",
  },
  {
    name: SkillName.PERCEPTION,
    ability: AbilityName.WISDOM,
    display: "Perception",
  },
  {
    name: SkillName.PERFORMANCE,
    ability: AbilityName.CHARISMA,
    display: "Performance",
  },
  {
    name: SkillName.PERSUASION,
    ability: AbilityName.CHARISMA,
    display: "Persuasion",
  },
  {
    name: SkillName.RELIGION,
    ability: AbilityName.INTELLIGENCE,
    display: "Religion",
  },
  {
    name: SkillName.SLEIGHT_OF_HAND,
    ability: AbilityName.DEXTERITY,
    display: "Sleight of Hand",
  },
  {
    name: SkillName.STEALTH,
    ability: AbilityName.DEXTERITY,
    display: "Stealth",
  },
  {
    name: SkillName.SURVIVAL,
    ability: AbilityName.WISDOM,
    display: "Survival",
  },
];

const ABILITIES = [
  { name: AbilityName.STRENGTH, display: "Strength" },
  { name: AbilityName.DEXTERITY, display: "Dexterity" },
  { name: AbilityName.CONSTITUTION, display: "Constitution" },
  { name: AbilityName.INTELLIGENCE, display: "Intelligence" },
  { name: AbilityName.WISDOM, display: "Wisdom" },
  { name: AbilityName.CHARISMA, display: "Charisma" },
];

export default function CharacterSkillsStep({
  form,
}: CharacterSkillsStepProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;

  const abilityScores = watch("abilityScores");
  const skillProficiencies = watch("skillProficiencies");
  const savingThrows = watch("savingThrows");
  const level = watch("level") || 1;

  const proficiencyBonus = Math.ceil(level / 4) + 1;

  const calculateModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const getSkillModifier = (skillIndex: number): number => {
    const skill = skillProficiencies[skillIndex];
    const abilityScore =
      abilityScores[
        SKILLS[skillIndex].ability.toLowerCase() as keyof typeof abilityScores
      ];
    const baseModifier = calculateModifier(abilityScore);
    const proficiencyMultiplier = skill.expertise
      ? 2
      : skill.proficient
      ? 1
      : 0;
    return baseModifier + proficiencyMultiplier * proficiencyBonus;
  };

  const getSavingThrowModifier = (ability: AbilityName): number => {
    const abilityScore =
      abilityScores[ability.toLowerCase() as keyof typeof abilityScores];
    const baseModifier = calculateModifier(abilityScore);
    const isProficient = savingThrows[ability.toLowerCase()];
    return baseModifier + (isProficient ? proficiencyBonus : 0);
  };

  const toggleProficiency = (skillIndex: number) => {
    const currentSkill = skillProficiencies[skillIndex];
    const newProficiencies = [...skillProficiencies];

    if (currentSkill.expertise) {
      // If expertise, remove expertise
      newProficiencies[skillIndex] = {
        ...currentSkill,
        expertise: false,
        proficient: true,
      };
    } else if (currentSkill.proficient) {
      // If proficient, remove proficiency
      newProficiencies[skillIndex] = { ...currentSkill, proficient: false };
    } else {
      // If neither, add proficiency
      newProficiencies[skillIndex] = { ...currentSkill, proficient: true };
    }

    setValue("skillProficiencies", newProficiencies);
  };

  const toggleExpertise = (skillIndex: number) => {
    const currentSkill = skillProficiencies[skillIndex];
    const newProficiencies = [...skillProficiencies];

    newProficiencies[skillIndex] = {
      ...currentSkill,
      expertise: !currentSkill.expertise,
      proficient: true, // Must be proficient to have expertise
    };

    setValue("skillProficiencies", newProficiencies);
  };

  const toggleSavingThrow = (ability: AbilityName) => {
    const newSavingThrows = { ...savingThrows };
    newSavingThrows[ability.toLowerCase()] =
      !newSavingThrows[ability.toLowerCase()];
    setValue("savingThrows", newSavingThrows);
  };

  const getModifierDisplay = (modifier: number): string => {
    return modifier >= 0 ? `+${modifier}` : modifier.toString();
  };

  const proficientSkillsCount = skillProficiencies.filter(
    (s) => s.proficient,
  ).length;
  const expertiseSkillsCount = skillProficiencies.filter(
    (s) => s.expertise,
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Skills & Proficiencies
        </h2>
        <p className="mb-6 text-gray-600">
          Choose your character's skills and saving throw proficiencies.
          Proficiency bonus: +{proficiencyBonus}
        </p>
      </div>

      {/* Proficiency Summary */}
      <div className="p-4 rounded-lg bg-blue-50">
        <h3 className="mb-2 font-medium text-blue-900">Proficiency Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Skills Proficient:</span>
            <span className="ml-2 font-medium">{proficientSkillsCount}</span>
          </div>
          <div>
            <span className="text-blue-700">Skills with Expertise:</span>
            <span className="ml-2 font-medium">{expertiseSkillsCount}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Skills Section */}
        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">Skills</h3>
          <div className="space-y-2">
            {SKILLS.map((skill, index) => {
              const modifier = getSkillModifier(index);
              const isProficient = skillProficiencies[index].proficient;
              const hasExpertise = skillProficiencies[index].expertise;

              return (
                <div
                  key={skill.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => toggleProficiency(index)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs font-bold ${
                        hasExpertise
                          ? "bg-blue-600 border-blue-600 text-white"
                          : isProficient
                          ? "bg-green-600 border-green-600 text-white"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {hasExpertise ? "E" : isProficient ? "P" : ""}
                    </button>
                    <div>
                      <span className="font-medium text-gray-900">
                        {skill.display}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        ({skill.ability.slice(0, 3)})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-lg font-bold text-right text-blue-600 min-w-12">
                      {getModifierDisplay(modifier)}
                    </span>
                    {isProficient && (
                      <button
                        type="button"
                        onClick={() => toggleExpertise(index)}
                        className={`px-2 py-1 text-xs rounded ${
                          hasExpertise
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        Expertise
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Saving Throws Section */}
        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            Saving Throws
          </h3>
          <div className="space-y-2">
            {ABILITIES.map((ability) => {
              const modifier = getSavingThrowModifier(ability.name);
              const isProficient = savingThrows[ability.name.toLowerCase()];

              return (
                <div
                  key={ability.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => toggleSavingThrow(ability.name)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs font-bold ${
                        isProficient
                          ? "bg-green-600 border-green-600 text-white"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {isProficient ? "P" : ""}
                    </button>
                    <span className="font-medium text-gray-900">
                      {ability.display}
                    </span>
                  </div>
                  <span className="font-mono text-lg font-bold text-blue-600">
                    {getModifierDisplay(modifier)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
