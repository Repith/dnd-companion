"use client";

import React from "react";
import { CharacterResponseDto } from "@/types/character";
import { characterApi } from "@/lib/api/character";

interface SpellSlotTrackerProps {
  character: CharacterResponseDto;
  onCharacterUpdate: (character: CharacterResponseDto) => void;
}

export const SpellSlotTracker: React.FC<SpellSlotTrackerProps> = ({
  character,
  onCharacterUpdate,
}) => {
  const spellSlots = character.spellcasting?.slots || {};
  const remainingSlots = character.spellcasting?.remainingSlots || {};

  const handleSlotChange = async (level: number, newValue: number) => {
    const maxSlots = spellSlots[level] || 0;
    const clampedValue = Math.max(0, Math.min(maxSlots, newValue));

    const updatedRemainingSlots = {
      ...remainingSlots,
      [level]: clampedValue,
    };

    try {
      const updatedCharacter = await characterApi.updateSpellSlots(
        character.id,
        updatedRemainingSlots,
      );
      onCharacterUpdate(updatedCharacter);
    } catch (error) {
      console.error("Failed to update spell slots:", error);
    }
  };

  const getSpellSlotLevels = () => {
    return Object.keys(spellSlots)
      .map((level) => parseInt(level))
      .filter((level) => spellSlots[level] > 0)
      .sort((a, b) => a - b);
  };

  const spellSlotLevels = getSpellSlotLevels();

  if (spellSlotLevels.length === 0) {
    return (
      <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
          Spell Slots
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          No spell slots available for this character.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Spell Slots
      </h3>

      <div className="space-y-3">
        {spellSlotLevels.map((level) => {
          const maxSlots = spellSlots[level];
          const remaining = remainingSlots[level] || maxSlots;
          const used = maxSlots - remaining;

          return (
            <div key={level} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[60px]">
                  Level {level}
                </span>

                {/* Slot Circles */}
                <div className="flex space-x-1">
                  {Array.from({ length: maxSlots }, (_, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        handleSlotChange(
                          level,
                          maxSlots - index - (index < used ? 0 : 1),
                        )
                      }
                      className={`w-6 h-6 rounded-full border-2 transition-colors ${
                        index < used
                          ? "bg-red-500 border-red-500"
                          : "bg-white border-gray-300 hover:border-blue-400 dark:bg-gray-700 dark:border-gray-600"
                      }`}
                      aria-label={`Toggle spell slot ${
                        index + 1
                      } for level ${level}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSlotChange(level, remaining - 1)}
                  disabled={remaining <= 0}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    remaining <= 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                  }`}
                  aria-label={`Use spell slot level ${level}`}
                >
                  -
                </button>

                <span className="text-sm font-medium text-center min-w-10">
                  {remaining}/{maxSlots}
                </span>

                <button
                  onClick={() => handleSlotChange(level, remaining + 1)}
                  disabled={remaining >= maxSlots}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    remaining >= maxSlots
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                  }`}
                  aria-label={`Restore spell slot level ${level}`}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="pt-3 mt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Total Slots Used:</span>
          <span>
            {spellSlotLevels.reduce((total, level) => {
              const maxSlots = spellSlots[level];
              const remaining = remainingSlots[level] || maxSlots;
              return total + (maxSlots - remaining);
            }, 0)}
          </span>
        </div>
      </div>
    </div>
  );
};
