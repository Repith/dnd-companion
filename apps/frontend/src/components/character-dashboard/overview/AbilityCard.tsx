// character-dashboard/overview/AbilityCard.tsx
"use client";

import { useEffect, useState } from "react";
import { AbilityName, CharacterResponseDto } from "@/types/character";
import {
  Brain,
  Shield,
  Swords,
  Feather,
  Eye,
  Sparkles,
  CheckCircle2,
  Circle,
  CircleDot,
  Dice5,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import {
  getSkillModifier,
  ABILITY_SKILLS,
  calculateModifier,
  getModifierDisplay,
  getSavingThrowModifier,
} from "../utils";
import { useDiceRoller } from "@/contexts/dice-roller";

type RollMode = "normal" | "advantage" | "disadvantage";

interface SkillSettings {
  mode: RollMode;
  extra: number;
}

interface AbilityCardProps {
  character: CharacterResponseDto;
  ability: AbilityName;
  proficiencyBonus: number;
  onUpdate?: (updates: Partial<CharacterResponseDto>) => void;
}

export const AbilityCard: React.FC<AbilityCardProps> = ({
  character,
  ability,
  proficiencyBonus,
  onUpdate,
}) => {
  const abilityKey = ability.toLowerCase() as keyof NonNullable<
    CharacterResponseDto["abilityScores"]
  >;

  const { isReady, roll } = useDiceRoller();

  // Ability score / modifier
  const score = Number(character.abilityScores?.[abilityKey] ?? 10);
  const modifier = calculateModifier(score);
  const [scoreInput, setScoreInput] = useState<string>(score.toString());

  useEffect(() => {
    setScoreInput(score.toString());
  }, [score]);

  // Saving throw proficiency
  const savingThrowProficient =
    character.savingThrows?.[
      abilityKey as keyof NonNullable<CharacterResponseDto["savingThrows"]>
    ] ?? false;

  // Saving throw local settings (advantage / extra mod)
  const [saveSettings, setSaveSettings] = useState<{
    mode: RollMode;
    extra: number;
  }>({ mode: "normal", extra: 0 });

  // Per-skill local settings
  const [skillSettings, setSkillSettings] = useState<
    Record<string, SkillSettings>
  >({});

  const relatedSkillNames = ABILITY_SKILLS[ability] ?? [];

  const getSkillSettings = (skill: string): SkillSettings =>
    skillSettings[skill] ?? { mode: "normal", extra: 0 };

  const updateSkillSettings = (
    skill: string,
    patch: Partial<SkillSettings>,
  ) => {
    setSkillSettings((prev) => ({
      ...prev,
      [skill]: {
        mode: "normal",
        extra: 0,
        ...(prev[skill] ?? {}),
        ...patch,
      },
    }));
  };

  const cycleSkillMode = (skill: string) => {
    const current = getSkillSettings(skill).mode;
    const next: RollMode =
      current === "normal"
        ? "advantage"
        : current === "advantage"
        ? "disadvantage"
        : "normal";
    updateSkillSettings(skill, { mode: next });
  };

  const cycleSaveMode = () => {
    setSaveSettings((prev) => {
      const next: RollMode =
        prev.mode === "normal"
          ? "advantage"
          : prev.mode === "advantage"
          ? "disadvantage"
          : "normal";
      return { ...prev, mode: next };
    });
  };

  const handleScoreBlur = () => {
    const parsed = parseInt(scoreInput, 10);
    if (Number.isNaN(parsed) || parsed <= 0 || parsed > 30) {
      setScoreInput(score.toString());
      return;
    }
    if (parsed === score || !onUpdate) return;

    onUpdate({
      abilityScores: {
        ...character.abilityScores,
        [abilityKey]: parsed,
      } as CharacterResponseDto["abilityScores"],
    });
  };

  const handleSavingThrowProfToggle = () => {
    if (!onUpdate) return;
    onUpdate({
      savingThrows: {
        ...character.savingThrows,
        [abilityKey]: !savingThrowProficient,
      } as CharacterResponseDto["savingThrows"],
    });
  };

  const handleSkillProfCycle = (skillName: string) => {
    if (!onUpdate) return;

    const existing = character.skillProficiencies.find(
      (s) => s.skill === skillName,
    );

    const nextState = (() => {
      if (!existing || (!existing.proficient && !existing.expertise)) {
        return { proficient: true, expertise: false };
      }
      if (existing.proficient && !existing.expertise) {
        return { proficient: true, expertise: true };
      }
      return { proficient: false, expertise: false };
    })();

    const others = character.skillProficiencies.filter(
      (s) => s.skill !== skillName,
    );

    const updated = [
      ...others,
      {
        ...(existing ?? {
          id: skillName, // placeholder only for React key
          skill: skillName,
        }),
        ...nextState,
      },
    ];

    onUpdate({ skillProficiencies: updated });
  };

  // --- rolling helpers ---

  const buildD20Expression = (mode: RollMode, modifier: number): string => {
    const dicePart =
      mode === "advantage"
        ? "2d20kh1"
        : mode === "disadvantage"
        ? "2d20kl1"
        : "1d20";

    if (modifier === 0) return dicePart;
    return `${dicePart}${modifier > 0 ? `+${modifier}` : modifier}`;
  };

  const rollD20WithModifier = async (
    label: string,
    mode: RollMode,
    modifierValue: number,
  ) => {
    if (!isReady) return;

    const expr = buildD20Expression(mode, modifierValue);

    try {
      await roll([{ notation: expr }], { label } as any, character.id);
    } catch (err) {
      console.error("Roll failed", err);
    }
  };

  const handleSavingThrowRoll = () => {
    const base = getSavingThrowModifier(character, ability, proficiencyBonus);
    const total = base + saveSettings.extra;
    rollD20WithModifier(
      `${formatAbilityName(ability)} Saving Throw`,
      saveSettings.mode,
      total,
    );
  };

  const handleSkillRoll = (skillName: string) => {
    const base = getSkillModifier(character, skillName, proficiencyBonus);
    const setting = getSkillSettings(skillName);
    const total = base + setting.extra;
    rollD20WithModifier(
      `${formatSkillName(skillName)} check`,
      setting.mode,
      total,
    );
  };

  // --- rendering ---

  const Icon = getAbilityIcon(ability);

  return (
    <section className="flex flex-col p-3 border shadow-sm rounded-2xl border-slate-200 bg-white/95 dark:border-slate-700 dark:bg-slate-900/95">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center border rounded-full h-7 w-7 border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800">
            <Icon className="w-4 h-4 text-slate-700 dark:text-slate-100" />
          </span>
          <div className="text-xs font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-200">
            {formatAbilityName(ability)}
          </div>
        </div>
      </div>

      {/* MOD + SCORE INPUT */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="relative flex items-center justify-center w-20 h-20 text-2xl font-bold border-2 rounded-full border-slate-400 bg-slate-50 text-slate-900 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-50">
          {getModifierDisplay(modifier)}
          <div className="pointer-events-none absolute inset-x-3 top-1 flex justify-center text-[0.55rem] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Modifier
          </div>
          <div className="absolute -bottom-2 flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[0.55rem] uppercase tracking-wide text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
            <span>Score</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {score}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end flex-1 gap-1 text-xs">
          <label className="text-[0.65rem] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Edit Score
          </label>
          <input
            type="number"
            min={1}
            max={30}
            value={scoreInput}
            onChange={(e) => setScoreInput(e.target.value)}
            onBlur={handleScoreBlur}
            className="w-16 px-2 py-1 text-sm font-medium text-right bg-white border rounded-md shadow-sm border-slate-300 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
          />
        </div>
      </div>

      {/* SAVING THROW */}
      <button
        type="button"
        onClick={handleSavingThrowRoll}
        className="mb-2 flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-left text-xs hover:bg-emerald-50/70 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSavingThrowProfToggle();
            }}
            className="rounded-full p-0.5 text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-300"
          >
            {savingThrowProficient ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>
          <span className="font-medium text-slate-800 dark:text-slate-100">
            Saving Throw
          </span>
        </div>

        <div className="flex items-center gap-1">
          <input
            type="number"
            value={saveSettings.extra.toString()}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              setSaveSettings((prev) => ({
                ...prev,
                extra: Number(e.target.value) || 0,
              }))
            }
            className="w-10 rounded-md border border-slate-300 bg-white px-1 py-0.5 text-right text-[0.7rem] text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
            placeholder="+0"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cycleSaveMode();
            }}
            className="rounded-full p-0.5 text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-300"
          >
            {saveSettings.mode === "normal" && (
              <ChevronsUpDown className="w-4 h-4" />
            )}
            {saveSettings.mode === "advantage" && (
              <ChevronUp className="w-4 h-4" />
            )}
            {saveSettings.mode === "disadvantage" && (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-50">
            {getModifierDisplay(
              getSavingThrowModifier(character, ability, proficiencyBonus) +
                saveSettings.extra,
            )}
          </span>
          <Dice5 className="w-4 h-4 text-slate-400" />
        </div>
      </button>

      {/* SKILLS – pełna lista z tej ability */}
      {relatedSkillNames.length > 0 && (
        <div className="mt-1 space-y-1.5 text-xs">
          {relatedSkillNames.map((skillName: string) => {
            const prof = character.skillProficiencies.find(
              (s) => s.skill === skillName,
            ) ?? { proficient: false, expertise: false };

            const settings = getSkillSettings(skillName);
            const baseMod = getSkillModifier(
              character,
              skillName,
              proficiencyBonus,
            );
            const totalMod = baseMod + settings.extra;

            const profIcon =
              !prof.proficient && !prof.expertise ? (
                <Circle className="w-4 h-4" />
              ) : prof.proficient && !prof.expertise ? (
                <CircleDot className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              );

            return (
              <button
                key={skillName}
                type="button"
                onClick={() => handleSkillRoll(skillName)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSkillProfCycle(skillName);
                    }}
                    className="rounded-full p-0.5 text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-300"
                  >
                    {profIcon}
                  </button>
                  <span className="text-slate-800 dark:text-slate-100">
                    {formatSkillName(skillName)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={settings.extra.toString()}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      updateSkillSettings(skillName, {
                        extra: Number(e.target.value) || 0,
                      })
                    }
                    className="w-10 rounded-md border border-slate-300 bg-white px-1 py-0.5 text-right text-[0.7rem] text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
                    placeholder="+0"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cycleSkillMode(skillName);
                    }}
                    className="rounded-full p-0.5 text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-300"
                  >
                    {settings.mode === "normal" && (
                      <ChevronsUpDown className="w-4 h-4" />
                    )}
                    {settings.mode === "advantage" && (
                      <ChevronUp className="w-4 h-4" />
                    )}
                    {settings.mode === "disadvantage" && (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {getModifierDisplay(totalMod)}
                  </span>
                  <Dice5 className="w-3 h-3 text-slate-400" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

const formatAbilityName = (ability: AbilityName): string =>
  ability.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());

const formatSkillName = (raw: string): string =>
  raw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());

const getAbilityIcon = (ability: AbilityName) => {
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
      return Sparkles;
  }
};
