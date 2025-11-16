"use client";

import { useState } from "react";
import { AbilityName, CharacterResponseDto } from "@/types/character";
import {
  Brain,
  Shield,
  Swords,
  Feather,
  Eye,
  Sparkles,
  Dice5,
} from "lucide-react";
import { useDiceRoller } from "@/contexts/dice-roller";
import { useCharacterEventBus } from "@/contexts/CharacterEventBus";

interface AbilityCardProps {
  character: CharacterResponseDto;
  ability: AbilityName;
  proficiencyBonus: number;
  onUpdate?: (updates: Partial<CharacterResponseDto>) => void;
}

type RollMode = "normal" | "advantage" | "disadvantage";

export const AbilityCard: React.FC<AbilityCardProps> = ({
  character,
  ability,
}) => {
  const { updateAbilityScore } = useCharacterEventBus();
  const { isReady, roll } = useDiceRoller();

  const score = character.abilityScores?.[ability] ?? 10;
  const modifier = Math.floor((score - 10) / 2);

  const [scoreInput, setScoreInput] = useState<string>(String(score));
  const [rollMode, setRollMode] = useState<RollMode>("normal");

  const prettyName = ability.toLowerCase();

  const Icon = getAbilityIcon(ability);

  const handleChangeScore = async (next: number) => {
    if (next < 1 || next > 30) return;
    setScoreInput(String(next));
    await updateAbilityScore(character.id, ability, next);
  };

  const handleInputBlur = async () => {
    const parsed = parseInt(scoreInput, 10);
    if (Number.isNaN(parsed)) {
      setScoreInput(String(score));
      return;
    }
    await handleChangeScore(parsed);
  };

  const toggleRollMode = () => {
    setRollMode((prev) =>
      prev === "normal"
        ? "advantage"
        : prev === "advantage"
        ? "disadvantage"
        : "normal",
    );
  };

  const handleRoll = async () => {
    if (!isReady) return;

    const base =
      modifier === 0
        ? "1d20"
        : `1d20${modifier > 0 ? `+${modifier}` : modifier}`;
    let notations: string[] = [];

    switch (rollMode) {
      case "normal":
        notations = [base];
        break;
      case "advantage":
        notations = [base, base];
        break;
      case "disadvantage":
        notations = [base, base];
        break;
    }

    try {
      await roll(
        notations.map((notation) => ({ notation } as any)),
        {
          label: `${prettyName} check (${rollMode})`,
          rollMode,
        } as any,
        character.id,
      );
    } catch (error) {
      console.error("Ability roll failed", error);
    }
  };

  return (
    <section className="flex flex-col gap-2 p-3 border shadow-sm rounded-2xl border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900/90">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-full h-7 w-7 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-200">
            <Icon className="w-4 h-4" />
          </span>
          <span className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-300">
            {prettyName}
          </span>
        </div>

        <button
          type="button"
          onClick={toggleRollMode}
          className="flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[0.65rem] font-medium uppercase tracking-wide text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Dice5 className="w-3 h-3" />
          {rollMode === "normal"
            ? "Normal"
            : rollMode === "advantage"
            ? "Adv."
            : "Disadv."}
        </button>
      </header>

      <div className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease ability"
            className="flex items-center justify-center w-6 h-6 text-xs border rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => handleChangeScore(score - 1)}
          >
            –
          </button>

          <div className="flex flex-col items-center">
            <input
              type="number"
              className="px-2 py-1 text-sm font-semibold text-center border rounded-lg shadow-inner w-14 border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value)}
              onBlur={handleInputBlur}
              min={1}
              max={30}
            />
            <span className="mt-1 text-[0.65rem] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Score
            </span>
          </div>

          <button
            type="button"
            aria-label="Increase ability"
            className="flex items-center justify-center w-6 h-6 text-xs border rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => handleChangeScore(score + 1)}
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleRoll}
          className="flex flex-col items-center px-2 py-1 text-xs font-semibold transition-colors border shadow-sm rounded-xl border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
        >
          <span className="text-[0.65rem] uppercase tracking-wide">
            Modifier
          </span>
          <span className="text-sm font-bold">
            {modifier >= 0 ? `+${modifier}` : modifier}
          </span>
        </button>
      </div>
    </section>
  );
};

function getAbilityIcon(ability: AbilityName) {
  switch (ability) {
    case AbilityName.STRENGTH:
      return Swords;
    case AbilityName.DEXTERITY:
      return Feather;
    case AbilityName.CONSTITUTION:
      return Shield;
    case AbilityName.INTELLIGENCE:
      return Brain;
    case AbilityName.WISDOM:
      return Eye;
    case AbilityName.CHARISMA:
      return Sparkles;
    default:
      return Sparkles;
  }
}
