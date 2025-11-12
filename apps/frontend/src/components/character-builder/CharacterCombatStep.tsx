"use client";

import { UseFormReturn } from "react-hook-form";
import { CreateCharacterFormData } from "@/lib/validations/character";

interface CharacterCombatStepProps {
  form: UseFormReturn<CreateCharacterFormData>;
}

export default function CharacterCombatStep({
  form,
}: CharacterCombatStepProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const abilityScores = watch("abilityScores");
  const constitutionModifier = Math.floor(
    (abilityScores.constitution - 10) / 2,
  );

  // Auto-calculate max HP based on class and constitution
  const calculateMaxHP = () => {
    // This is a simplified calculation - in a real app, you'd need class-specific hit dice
    const baseHP = 8; // Assuming fighter/wizard type for level 1
    return Math.max(1, baseHP + constitutionModifier);
  };

  const handleAutoCalculateHP = () => {
    const maxHP = calculateMaxHP();
    setValue("hitPoints.max", maxHP);
    setValue("hitPoints.current", maxHP);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Combat Statistics
        </h2>
        <p className="mb-6 text-gray-600">
          Set your character's combat-related attributes and hit points.
        </p>
      </div>

      {/* Hit Points */}
      <div className="p-6 rounded-lg bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Hit Points</h3>
          <button
            type="button"
            onClick={handleAutoCalculateHP}
            className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Auto Calculate
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="maxHP"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Maximum HP *
            </label>
            <input
              {...register("hitPoints.max", { valueAsNumber: true })}
              type="number"
              id="maxHP"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.hitPoints?.max && (
              <p className="mt-1 text-sm text-red-600">
                {errors.hitPoints.max.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="currentHP"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Current HP *
            </label>
            <input
              {...register("hitPoints.current", { valueAsNumber: true })}
              type="number"
              id="currentHP"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.hitPoints?.current && (
              <p className="mt-1 text-sm text-red-600">
                {errors.hitPoints.current.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="tempHP"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Temporary HP
            </label>
            <input
              {...register("hitPoints.temporary", { valueAsNumber: true })}
              type="number"
              id="tempHP"
              min="0"
              defaultValue="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Combat Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="armorClass"
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Armor Class (AC) *
          </label>
          <input
            {...register("armorClass", { valueAsNumber: true })}
            type="number"
            id="armorClass"
            min="5"
            max="25"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.armorClass && (
            <p className="mt-1 text-sm text-red-600">
              {errors.armorClass.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="initiative"
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Initiative Modifier
          </label>
          <input
            {...register("initiative", { valueAsNumber: true })}
            type="number"
            id="initiative"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="speed"
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Speed (feet) *
          </label>
          <input
            {...register("speed", { valueAsNumber: true })}
            type="number"
            id="speed"
            min="5"
            max="120"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.speed && (
            <p className="mt-1 text-sm text-red-600">{errors.speed.message}</p>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-lg bg-green-50">
        <h3 className="mb-2 font-medium text-green-900">Combat Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <span className="text-green-700">Max HP:</span>
            <span className="ml-2 font-medium">
              {watch("hitPoints.max") || 0}
            </span>
          </div>
          <div>
            <span className="text-green-700">Current HP:</span>
            <span className="ml-2 font-medium">
              {watch("hitPoints.current") || 0}
            </span>
          </div>
          <div>
            <span className="text-green-700">AC:</span>
            <span className="ml-2 font-medium">{watch("armorClass") || 0}</span>
          </div>
          <div>
            <span className="text-green-700">Speed:</span>
            <span className="ml-2 font-medium">{watch("speed") || 0} ft</span>
          </div>
        </div>
      </div>
    </div>
  );
}
