"use client";

import { DiceRollResponseDto } from "@/types/character";
import { useAuth } from "@/contexts/AuthContext";
import { useRollHistory } from "@/contexts/RollHistoryContext";

interface RollHistoryProps {
  characterId: string;
}

export default function RollHistory({ characterId }: RollHistoryProps) {
  const { user } = useAuth();
  const { useRolls } = useRollHistory();
  const { data: apiRolls, isLoading: loading, error } = useRolls(characterId);

  console.log("DEBUG: RollHistory rendering", {
    characterId,
    apiRolls,
    loading,
    error,
    userDemo: user?.isDemo,
  });

  // Use API data or demo data (logic moved after demoRolls definition)

  // Demo data for when no rolls exist in demo mode
  const demoRolls: DiceRollResponseDto[] = [
    {
      id: "demo-1",
      userId: user?.id || "demo-user",
      characterId: characterId,
      diceType: "d20",
      numberOfDice: 1,
      individualResults: [15],
      totalResult: 15,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: "demo-2",
      userId: user?.id || "demo-user",
      characterId: characterId,
      diceType: "2d6",
      numberOfDice: 2,
      individualResults: [4, 3],
      totalResult: 7,
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
    {
      id: "demo-3",
      userId: user?.id || "demo-user",
      characterId: characterId,
      diceType: "d4",
      numberOfDice: 1,
      individualResults: [2],
      totalResult: 2,
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

  // TanStack Query handles data fetching and caching automatically

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

  if (!rolls || rolls.length === 0) {
    return (
      <div className="py-8 text-center" role="status">
        <div className="text-gray-500 dark:text-gray-400">
          No dice rolls recorded for this character yet.
        </div>
        <div className="mt-2 text-sm text-gray-400 dark:text-gray-500">
          Rolls will appear here once you start rolling dice for this character.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 sr-only dark:text-white">
        Dice Roll History
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
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">
                    {roll.diceType}
                  </div>
                  <div
                    className="text-xl font-bold text-blue-600 sm:text-2xl dark:text-blue-400"
                    aria-label={`Total result: ${roll.totalResult}`}
                  >
                    {roll.totalResult}
                  </div>
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
