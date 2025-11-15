"use client";

import { UseFormReturn } from "react-hook-form";
import { CreateCharacterFormData } from "@/lib/validations/character";
import { AbilityName } from "@/types/character";

interface CharacterAbilityScoresStepProps {
  form: UseFormReturn<CreateCharacterFormData>;
}

const ABILITY_SCORES = [
  { key: "strength" as const, name: "Strength", abbr: "STR" },
  { key: "dexterity" as const, name: "Dexterity", abbr: "DEX" },
  { key: "constitution" as const, name: "Constitution", abbr: "CON" },
  { key: "intelligence" as const, name: "Intelligence", abbr: "INT" },
  { key: "wisdom" as const, name: "Wisdom", abbr: "WIS" },
  { key: "charisma" as const, name: "Charisma", abbr: "CHA" },
];

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export default function CharacterAbilityScoresStep({
  form,
}: CharacterAbilityScoresStepProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const abilityScores = watch("abilityScores");

  const calculateModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const getModifierDisplay = (modifier: number): string => {
    return modifier >= 0 ? `+${modifier}` : modifier.toString();
  };

  const handleScoreChange = (
    ability: keyof typeof abilityScores,
    value: number,
  ) => {
    setValue(`abilityScores.${ability}`, value);
  };

  const useStandardArray = () => {
    const sortedAbilities = [...ABILITY_SCORES].sort((a, b) => {
      const aScore = abilityScores[a.key];
      const bScore = abilityScores[b.key];
      return bScore - aScore; // Sort descending
    });

    sortedAbilities.forEach((ability, index) => {
      setValue(`abilityScores.${ability.key}`, STANDARD_ARRAY[index]);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Ability Scores
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Determine your character's raw potential. You can use the standard
          array or assign scores manually.
        </p>
      </div>

      {/* Standard Array Button */}
      <div className="flex justify-center mb-6">
        <button
          type="button"
          onClick={useStandardArray}
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          Use Standard Array (15, 14, 13, 12, 10, 8)
        </button>
      </div>

      {/* Ability Score Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ABILITY_SCORES.map((ability) => {
          const score = abilityScores[ability.key];
          const modifier = calculateModifier(score);

          return (
            <div
              key={ability.key}
              className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {ability.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {ability.abbr}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {getModifierDisplay(modifier)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    modifier
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() =>
                    handleScoreChange(ability.key, Math.max(3, score - 1))
                  }
                  className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                  disabled={score <= 3}
                >
                  -
                </button>

                <input
                  {...register(`abilityScores.${ability.key}`, {
                    valueAsNumber: true,
                  })}
                  type="number"
                  min="3"
                  max="20"
                  className="flex-1 px-3 py-2 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  onChange={(e) =>
                    handleScoreChange(
                      ability.key,
                      parseInt(e.target.value) || 3,
                    )
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    handleScoreChange(ability.key, Math.min(20, score + 1))
                  }
                  className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                  disabled={score >= 20}
                >
                  +
                </button>
              </div>

              {errors.abilityScores?.[ability.key] && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.abilityScores[ability.key]?.message}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="p-4 mt-6 rounded-lg bg-blue-50 dark:bg-blue-900">
        <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
          Ability Score Summary
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
          {ABILITY_SCORES.map((ability) => (
            <div key={ability.key} className="flex justify-between">
              <span className="text-blue-700 dark:text-blue-300">
                {ability.abbr}:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {abilityScores[ability.key]} (
                {getModifierDisplay(
                  calculateModifier(abilityScores[ability.key]),
                )}
                )
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
