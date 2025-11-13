"use client";

import { useState, useEffect } from "react";
import { DiceRollResponseDto } from "@/types/character";
import { characterApi } from "@/lib/api/character";
import { useAuth } from "@/contexts/AuthContext";
import { useRollHistory } from "@/contexts/RollHistoryContext";

interface DMRollHistoryProps {}

export default function DMRollHistory({}: DMRollHistoryProps) {
  const { user } = useAuth();
  const { useAllRolls } = useRollHistory();
  const { data: apiRolls, isLoading: loading, error } = useAllRolls();
  const [characterMap, setCharacterMap] = useState<Map<string, string>>(
    new Map(),
  );

  // Demo data for DM view - rolls from different characters
  const demoRolls: DiceRollResponseDto[] = [
    {
      id: "dm-demo-1",
      userId: user?.id || "demo-user",
      characterId: "demo-char-1", // Elara
      diceType: "d20",
      numberOfDice: 1,
      individualResults: [18],
      totalResult: 18,
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    },
    {
      id: "dm-demo-2",
      userId: user?.id || "demo-user",
      characterId: "demo-char-2", // Thrain
      diceType: "2d6",
      numberOfDice: 2,
      individualResults: [5, 4],
      totalResult: 9,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: "dm-demo-3",
      userId: user?.id || "demo-user",
      characterId: "demo-char-3", // Lyra
      diceType: "d4",
      numberOfDice: 1,
      individualResults: [3],
      totalResult: 3,
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
    {
      id: "dm-demo-4",
      userId: user?.id || "demo-user",
      characterId: "demo-char-1", // Elara
      diceType: "3d6",
      numberOfDice: 3,
      individualResults: [2, 6, 4],
      totalResult: 12,
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },
  ];

  // Use API data or demo data
  const rolls =
    apiRolls && apiRolls.length > 0
      ? apiRolls
      : user?.isDemo
      ? demoRolls
      : apiRolls || [];

  // Set up character map for demo mode or fetch from API
  useEffect(() => {
    if (user?.isDemo && rolls === demoRolls) {
      const demoCharacterMap = new Map<string, string>();
      demoCharacterMap.set("demo-char-1", "Elara Moonwhisper");
      demoCharacterMap.set("demo-char-2", "Thrain Ironfist");
      demoCharacterMap.set("demo-char-3", "Lyra Shadowstep");
      setCharacterMap(demoCharacterMap);
    } else if (rolls && rolls.length > 0) {
      // Fetch character names for rolls with characterId
      const characterIds = Array.from(
        new Set(rolls.map((r) => r.characterId).filter(Boolean)),
      );
      if (characterIds.length > 0) {
        characterApi
          .getAll()
          .then((characters) => {
            const map = new Map<string, string>();
            characters.forEach((char) => map.set(char.id, char.name));
            setCharacterMap(map);
          })
          .catch((err) => {
            console.error("Failed to fetch character names:", err);
          });
      }
    }
  }, [rolls, user?.isDemo]);

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-8"
        role="status"
        aria-live="polite"
      >
        <div
          className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"
          aria-hidden="true"
        ></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading roll history...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center" role="alert">
        <div className="text-red-600 dark:text-red-400">{error.message}</div>
      </div>
    );
  }

  if (rolls.length === 0) {
    return (
      <div className="py-8 text-center" role="status">
        <div className="text-gray-500 dark:text-gray-400">
          No dice rolls recorded yet.
        </div>
        <div className="mt-2 text-sm text-gray-400 dark:text-gray-500">
          Rolls will appear here once dice are rolled.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Roll History
      </h3>
      <div
        className="overflow-y-auto max-h-64 sm:max-h-96"
        role="log"
        aria-label="Dice roll history list"
        aria-live="polite"
      >
        <div role="list" className="space-y-4">
          {rolls.map((roll) => (
            <div
              key={roll.id}
              className="p-3 bg-white border rounded-lg shadow-sm sm:p-4 dark:bg-gray-800 dark:border-gray-700"
              role="listitem"
            >
              <div className="flex flex-col mb-2 space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2 sm:space-x-4">
                  <div className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">
                    {roll.diceType}
                  </div>
                  <div
                    className="text-xl font-bold text-blue-600 sm:text-2xl dark:text-blue-400"
                    aria-label={`Total result: ${roll.totalResult}`}
                  >
                    {roll.totalResult}
                  </div>
                  {roll.characterId && characterMap.has(roll.characterId) && (
                    <div
                      className="text-sm text-gray-600 dark:text-gray-400"
                      aria-label={`Rolled by ${characterMap.get(
                        roll.characterId,
                      )}`}
                    >
                      by {characterMap.get(roll.characterId)}
                    </div>
                  )}
                </div>
                <div
                  className="text-xs text-gray-500 sm:text-sm dark:text-gray-400"
                  aria-label={`Rolled at ${formatTimestamp(roll.timestamp)}`}
                >
                  {formatTimestamp(roll.timestamp)}
                </div>
              </div>

              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Individual rolls:
                </span>
                <div
                  className="flex flex-wrap gap-1"
                  role="list"
                  aria-label="Individual dice results"
                >
                  {roll.individualResults.map((result, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-sm text-gray-800 bg-gray-100 rounded dark:bg-gray-700 dark:text-gray-200"
                      role="listitem"
                      aria-label={`Roll ${index + 1}: ${result}`}
                    >
                      {result}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
