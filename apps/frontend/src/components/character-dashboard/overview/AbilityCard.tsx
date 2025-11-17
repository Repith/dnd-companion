"use client";

import { useState, useMemo } from "react";
import { AbilityName, CharacterResponseDto } from "@/types/character";
import {
  Brain,
  Shield,
  Swords,
  Feather,
  Eye,
  Sparkles,
  Dice5,
  CheckCircle2,
  Circle,
  Star,
} from "lucide-react";
import { useDiceRoller } from "@/contexts/dice-roller";
import { useCharacterEventBus } from "@/contexts/CharacterEventBus";
import { SKILLS_BY_ABILITY } from "@/types/skill-mapping";
import type { DiceNotation } from "@/contexts/dice-roller"; // <--- ważne

interface AbilityCardProps {
  character: CharacterResponseDto;
  ability: AbilityName;
  proficiencyBonus: number;
  onUpdate?: (updates: Partial<CharacterResponseDto>) => void;
}

type RollMode = "normal" | "advantage" | "disadvantage";

type SkillLevel = 0 | 1 | 2; // 0 = none, 1 = proficiency, 2 = expertise

export const AbilityCard: React.FC<AbilityCardProps> = ({
  character,
  ability,
  proficiencyBonus,
}) => {
  const {
    updateAbilityScore,
    updateSavingThrowProficiency,
    updateSkillProficiency,
  } = useCharacterEventBus();
  const { isReady, roll } = useDiceRoller();

  const abilityKey = ability.toLowerCase() as keyof NonNullable<
    CharacterResponseDto["abilityScores"]
  >;

  const score = Number(character.abilityScores?.[abilityKey] ?? 10);
  const modifier = Math.floor((score - 10) / 2);

  const [scoreInput, setScoreInput] = useState<string>(String(score));
  const [rollMode, setRollMode] = useState<RollMode>("normal");

  const prettyName = ability.charAt(0) + ability.slice(1).toLowerCase();
  const Icon = getAbilityIcon(ability);

  const savingThrowProficient =
    character.savingThrows?.[abilityKey as any] ?? false;
  const savingThrowBonus =
    modifier + (savingThrowProficient ? proficiencyBonus : 0);

  const skillsForAbility = useMemo(
    () => SKILLS_BY_ABILITY[ability] ?? [],
    [ability],
  );

  const skillStates = useMemo(() => {
    const list = character.skillProficiencies ?? [];
    const map = new Map<string, { proficient: boolean; expertise: boolean }>();

    for (const sp of list) {
      map.set(sp.skill, {
        proficient: sp.proficient,
        expertise: sp.expertise,
      });
    }

    return map;
  }, [character.skillProficiencies]);

  const getSkillLevel = (skillName: string): SkillLevel => {
    const state = skillStates.get(skillName);
    if (!state) return 0;
    if (state.expertise && state.proficient) return 2;
    if (state.proficient) return 1;
    return 0;
  };

  const getSkillBonus = (skillName: string): number => {
    const level = getSkillLevel(skillName);
    const prof =
      level === 0 ? 0 : level === 1 ? proficiencyBonus : 2 * proficiencyBonus;
    return modifier + prof;
  };

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

  // --- tu najważniejszy kawałek: budujemy listę notacji jako stringi ---
  const buildRollNotations = (base: string): DiceNotation[] => {
    switch (rollMode) {
      case "normal":
        return [base];
      case "advantage":
      case "disadvantage":
        // 2 kości przy advantage/disadvantage
        return [base, base];
      default:
        return [base];
    }
  };

  const rollWithLabel = async (label: string, totalModifier: number) => {
    if (!isReady) return;

    const base =
      totalModifier === 0
        ? "1d20"
        : `1d20${totalModifier > 0 ? `+${totalModifier}` : totalModifier}`;

    const notations = buildRollNotations(base);

    try {
      // UWAGA: przekazujemy *bez* mapowania na obiekty { notation }
      await roll(
        notations,
        {
          label: `${label} (${rollMode})`,
        },
        character.id,
      );
    } catch (error) {
      console.error("Roll failed", error);
    }
  };

  const handleAbilityRoll = () =>
    rollWithLabel(`${prettyName} check`, modifier);

  const handleSavingThrowRoll = () =>
    rollWithLabel(`${prettyName} saving throw`, savingThrowBonus);

  const handleSkillRoll = (skillName: string) =>
    rollWithLabel(`${skillName} (${prettyName})`, getSkillBonus(skillName));

  const handleToggleSavingThrowProficiency = async () => {
    await updateSavingThrowProficiency(
      character.id,
      abilityKey as string,
      !savingThrowProficient,
    );
  };

  const cycleSkillLevel = (skillName: string): [boolean, boolean] => {
    const current = getSkillLevel(skillName);
    switch (current) {
      case 0:
        return [true, false]; // proficiency
      case 1:
        return [true, true]; // expertise
      case 2:
      default:
        return [false, false]; // none
    }
  };

  const handleToggleSkill = async (skillName: string) => {
    const [proficient, expertise] = cycleSkillLevel(skillName);
    await updateSkillProficiency(
      character.id,
      skillName,
      proficient,
      expertise,
    );
  };

  return (
    <section className="flex flex-col gap-3 p-3 border shadow-sm rounded-2xl border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900/90">
      {/* Header: icon + name + roll mode */}
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
            <Icon className="w-5 h-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold uppercase text-slate-500">
              {prettyName}
            </span>
            <button
              type="button"
              onClick={toggleRollMode}
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            >
              <Dice5 className="w-3 h-3" />
              <span>{rollMode}</span>
            </button>
          </div>
        </div>

        {/* Score editor */}
        <div className="flex items-baseline gap-1">
          <button
            type="button"
            className="px-1 text-xs border rounded border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            onClick={() => handleChangeScore(score - 1)}
          >
            -
          </button>
          <input
            className="w-10 text-lg font-semibold text-center bg-transparent border-none focus:outline-none"
            value={scoreInput}
            onChange={(e) => setScoreInput(e.target.value)}
            onBlur={handleInputBlur}
          />
          <button
            type="button"
            className="px-1 text-xs border rounded border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            onClick={() => handleChangeScore(score + 1)}
          >
            +
          </button>
        </div>
      </header>

      {/* Ability modifier + main roll */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-slate-500">Modifier</span>
          <span className="text-lg font-bold">
            {modifier >= 0 ? `+${modifier}` : modifier}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAbilityRoll}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-indigo-600 rounded-full hover:bg-indigo-700"
        >
          <Dice5 className="w-3 h-3" />
          Ability check
        </button>
      </div>

      {/* Saving throw section */}
      <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-1 text-xs text-slate-500">
          <span>Saving throw</span>
          <span>
            {savingThrowBonus >= 0 ? `+${savingThrowBonus}` : savingThrowBonus}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleToggleSavingThrowProficiency}
            className="inline-flex items-center gap-2 text-xs"
          >
            {savingThrowProficient ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <Circle className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {savingThrowProficient ? "Proficient" : "Not proficient"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSavingThrowRoll}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-full border border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <Dice5 className="w-3 h-3" />
            Roll save
          </button>
        </div>
      </div>

      {/* Skills section */}
      {skillsForAbility.length > 0 && (
        <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
          <div className="mb-1 text-xs font-semibold text-slate-500">
            Skills
          </div>
          <div className="flex flex-col gap-1">
            {skillsForAbility.map((skill) => {
              const level = getSkillLevel(skill.key);
              const bonus = getSkillBonus(skill.key);

              return (
                <div
                  key={skill.key}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleSkill(skill.key)}
                    className="inline-flex items-center gap-1"
                  >
                    {level === 0 && (
                      <Circle className="w-3 h-3 text-slate-400" />
                    )}
                    {level === 1 && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    )}
                    {level === 2 && <Star className="w-3 h-3 text-amber-500" />}
                    <span>{skill.label}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-slate-600">
                      {bonus >= 0 ? `+${bonus}` : bonus}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSkillRoll(skill.key)}
                      className="inline-flex items-center justify-center w-6 h-6 border rounded-full border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <Dice5 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

function getAbilityIcon(ability: AbilityName) {
  switch (ability) {
    case "STRENGTH":
      return Swords;
    case "DEXTERITY":
      return Feather;
    case "CONSTITUTION":
      return Shield;
    case "INTELLIGENCE":
      return Brain;
    case "WISDOM":
      return Eye;
    case "CHARISMA":
      return Sparkles;
    default:
      return Dice5;
  }
}
