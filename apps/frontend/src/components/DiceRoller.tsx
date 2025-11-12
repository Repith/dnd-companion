"use client";

import { useState } from "react";
import { CharacterResponseDto, DiceRoll } from "@/types/character";

interface DiceRollerProps {
  character: CharacterResponseDto;
}

export default function DiceRoller({ character }: DiceRollerProps) {
  const [diceType, setDiceType] = useState("1d20");
  const [modifier, setModifier] = useState(0);
  const [rollHistory, setRollHistory] = useState<DiceRoll[]>([]);

  const rollDice = (diceString: string, mod: number = 0) => {
    const match = diceString.match(/^(\d+)d(\d+)$/);
    if (!match) return null;

    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);

    const rolls: number[] = [];
    let total = 0;

    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      rolls.push(roll);
      total += roll;
    }

    total += mod;

    const result: DiceRoll = {
      dice: diceString,
      result: total,
      rolls,
      modifier: mod,
      total,
    };

    setRollHistory((prev) => [result, ...prev.slice(0, 9)]); // Keep last 10 rolls
    return result;
  };

  const handleRoll = () => {
    rollDice(diceType, modifier);
  };

  const quickRolls = [
    { label: "Ability Check", dice: "1d20", modifier: 0 },
    {
      label: "Attack Roll",
      dice: "1d20",
      modifier: character.proficiencyBonus,
    },
    { label: "Damage (1d6)", dice: "1d6", modifier: 0 },
    { label: "Damage (1d8)", dice: "1d8", modifier: 0 },
    { label: "Damage (1d10)", dice: "1d10", modifier: 0 },
    { label: "Damage (1d12)", dice: "1d12", modifier: 0 },
    { label: "Saving Throw", dice: "1d20", modifier: 0 },
    { label: "Initiative", dice: "1d20", modifier: character.initiative },
  ];

  const getModifierDisplay = (mod: number): string => {
    if (mod === 0) return "";
    return mod > 0 ? `+${mod}` : mod.toString();
  };

  return (
    <div className="space-y-4">
      {/* Custom Roll */}
      <div className="p-4 rounded-lg bg-gray-50">
        <h3 className="mb-3 font-medium">Custom Roll</h3>
        <div className="flex mb-3 space-x-2">
          <select
            value={diceType}
            onChange={(e) => setDiceType(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d4">1d4</option>
            <option value="1d6">1d6</option>
            <option value="1d8">1d8</option>
            <option value="1d10">1d10</option>
            <option value="1d12">1d12</option>
            <option value="1d20">1d20</option>
            <option value="2d6">2d6</option>
            <option value="3d6">3d6</option>
            <option value="4d6">4d6</option>
          </select>
          <input
            type="number"
            value={modifier}
            onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
            placeholder="Modifier"
            className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleRoll}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Roll
          </button>
        </div>
      </div>

      {/* Quick Rolls */}
      <div className="p-4 rounded-lg bg-gray-50">
        <h3 className="mb-3 font-medium">Quick Rolls</h3>
        <div className="grid grid-cols-2 gap-2">
          {quickRolls.map((roll, index) => (
            <button
              key={index}
              onClick={() => rollDice(roll.dice, roll.modifier)}
              className="px-3 py-2 text-sm text-left bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              <div className="font-medium">{roll.label}</div>
              <div className="text-gray-600">
                {roll.dice}
                {getModifierDisplay(roll.modifier)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Roll History */}
      <div className="p-4 rounded-lg bg-gray-50">
        <h3 className="mb-3 font-medium">Roll History</h3>
        <div className="space-y-2 overflow-y-auto max-h-64">
          {rollHistory.length === 0 ? (
            <p className="text-sm text-gray-500">No rolls yet</p>
          ) : (
            rollHistory.map((roll, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-white border rounded"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-lg font-bold">
                    {roll.total}
                  </span>
                  <span className="text-sm text-gray-600">
                    {roll.dice}
                    {getModifierDisplay(roll.modifier || 0)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  [{roll.rolls.join(", ")}]
                </div>
              </div>
            ))
          )}
        </div>
        {rollHistory.length > 0 && (
          <button
            onClick={() => setRollHistory([])}
            className="px-3 py-1 mt-3 text-sm text-red-600 hover:text-red-800"
          >
            Clear History
          </button>
        )}
      </div>
    </div>
  );
}
