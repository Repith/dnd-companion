"use client";

import { useState } from "react";
import { DeathSaves } from "@/types/character";

export default function DeathSavesTracker() {
  const [deathSaves, setDeathSaves] = useState<DeathSaves>({
    successes: 0,
    failures: 0,
  });

  const addSuccess = () => {
    if (deathSaves.successes < 3) {
      setDeathSaves((prev) => ({ ...prev, successes: prev.successes + 1 }));
    }
  };

  const addFailure = () => {
    if (deathSaves.failures < 3) {
      setDeathSaves((prev) => ({ ...prev, failures: prev.failures + 1 }));
    }
  };

  const reset = () => {
    setDeathSaves({ successes: 0, failures: 0 });
  };

  const isStable = deathSaves.successes >= 3;
  const isDead = deathSaves.failures >= 3;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-xl font-bold">Death Saves</h2>
        <p className="text-sm text-gray-600">
          Track your character's death saving throws
        </p>
      </div>

      {/* Status */}
      <div className="p-4 text-center rounded-lg bg-gray-50">
        {isDead ? (
          <div className="text-red-600">
            <div className="text-2xl font-bold">💀 DEAD</div>
            <div className="text-sm">Character has died</div>
          </div>
        ) : isStable ? (
          <div className="text-green-600">
            <div className="text-2xl font-bold">✅ STABLE</div>
            <div className="text-sm">Character is stable</div>
          </div>
        ) : (
          <div className="text-yellow-600">
            <div className="text-2xl font-bold">😴 UNCONSCIOUS</div>
            <div className="text-sm">Character is unconscious</div>
          </div>
        )}
      </div>

      {/* Successes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-green-700">Successes</h3>
          <button
            onClick={addSuccess}
            disabled={deathSaves.successes >= 3}
            className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Success
          </button>
        </div>
        <div className="flex space-x-2">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-bold ${
                deathSaves.successes >= num
                  ? "bg-green-600 border-green-600 text-white"
                  : "border-gray-300 text-gray-400"
              }`}
            >
              {deathSaves.successes >= num ? "✓" : num}
            </div>
          ))}
        </div>
      </div>

      {/* Failures */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-red-700">Failures</h3>
          <button
            onClick={addFailure}
            disabled={deathSaves.failures >= 3}
            className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Failure
          </button>
        </div>
        <div className="flex space-x-2">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-bold ${
                deathSaves.failures >= num
                  ? "bg-red-600 border-red-600 text-white"
                  : "border-gray-300 text-gray-400"
              }`}
            >
              {deathSaves.failures >= num ? "✗" : num}
            </div>
          ))}
        </div>
      </div>

      {/* Rules Reminder */}
      <div className="p-4 rounded-lg bg-blue-50">
        <h4 className="mb-2 font-medium text-blue-900">
          Death Saving Throw Rules
        </h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Roll a d20 at the start of your turn while unconscious</li>
          <li>• 10 or higher = success, 9 or lower = failure</li>
          <li>• 3 successes = stable (conscious but can't take actions)</li>
          <li>• 3 failures = dead</li>
          <li>• Natural 20 = wake up with 1 HP</li>
          <li>• Natural 1 = count as 2 failures</li>
        </ul>
      </div>

      {/* Reset Button */}
      <div className="text-center">
        <button
          onClick={reset}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:text-gray-800 hover:bg-gray-50"
        >
          Reset Death Saves
        </button>
      </div>
    </div>
  );
}
