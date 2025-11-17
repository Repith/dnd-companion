"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import {
  Swords,
  Feather,
  Shield,
  Brain,
  Eye,
  Sparkles,
  Star,
  CheckCircle2,
  Circle,
  Dice5,
} from "lucide-react";

import { AbilityName, CharacterResponseDto } from "@/types/character";
import { SKILLS_BY_ABILITY } from "@/types/skill-mapping";

import { useCharacterEventBus } from "@/contexts/CharacterEventBus";
import { useDice } from "@/contexts/dice-roller/hook";

type RollMode = "normal" | "advantage" | "disadvantage";

interface AbilityCardProps {
  character: CharacterResponseDto;
  ability: AbilityName;
  proficiencyBonus: number;
}

/* ======================================================= */
/*                     Icon mapping                        */
/* ======================================================= */
const getIcon = (ability: AbilityName) => {
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
};

/* ======================================================= */
/*                       COMPONENT                         */
/* ======================================================= */
export const AbilityCard = ({
  character,
  ability,
  proficiencyBonus,
}: AbilityCardProps) => {
  const dice = useDice().build();
  const bus = useCharacterEventBus();

  const [rollMode, setRollMode] = useState<RollMode>("normal");
  const [editingScore, setEditingScore] = useState(false);
  const [localScore, setLocalScore] = useState(
    Number(
      character.abilityScores?.[
        ability.toLowerCase() as keyof CharacterResponseDto["abilityScores"]
      ] ?? 10,
    ),
  );

  const abilityKey =
    ability.toLowerCase() as keyof CharacterResponseDto["abilityScores"];

  const score = Number(character.abilityScores?.[abilityKey] ?? 10);
  const modifier = Math.floor((score - 10) / 2);

  const savingProficient = character.savingThrows?.[abilityKey] ?? false;
  const savingThrowBonus = modifier + (savingProficient ? proficiencyBonus : 0);

  const pretty = ability.charAt(0) + ability.slice(1).toLowerCase();
  const Icon = getIcon(ability);

  const skills = SKILLS_BY_ABILITY[ability] ?? [];

  const skillMap = useMemo(() => {
    const m = new Map<string, { proficient: boolean; expertise: boolean }>();
    for (const s of character.skillProficiencies ?? []) {
      m.set(s.skill, { proficient: s.proficient, expertise: s.expertise });
    }
    return m;
  }, [character.skillProficiencies]);

  const getSkillLevel = (skill: string) => {
    const state = skillMap.get(skill);
    if (!state) return 0;
    if (state.expertise) return 2;
    if (state.proficient) return 1;
    return 0;
  };

  const getSkillBonus = (skill: string) => {
    const lvl = getSkillLevel(skill);
    const prof =
      lvl === 2 ? proficiencyBonus * 2 : lvl === 1 ? proficiencyBonus : 0;
    return modifier + prof;
  };

  /* ======================================================= */
  /*                       Handlers                          */
  /* ======================================================= */

  const withRollMode = (mod: number) => {
    switch (rollMode) {
      case "advantage":
        return dice.advantage(mod);
      case "disadvantage":
        return dice.disadvantage(mod);
      default:
        return dice.d20().modifier(mod);
    }
  };

  const rollAbilityCheck = () =>
    withRollMode(modifier).label(`${pretty} Check`).roll();

  const rollSavingThrow = () =>
    withRollMode(savingThrowBonus).label(`${pretty} Saving Throw`).roll();

  const rollSkill = (name: string) =>
    withRollMode(getSkillBonus(name)).label(`${name} (${pretty})`).roll();

  const saveScore = async () => {
    if (localScore < 1 || localScore > 30) return;
    await bus.updateAbilityScore(character.id, ability, localScore);
    setEditingScore(false);
  };

  const toggleSavingProficiency = async () => {
    await bus.updateSavingThrowProficiency(
      character.id,
      abilityKey,
      !savingProficient,
    );
  };

  const toggleSkill = async (skill: string) => {
    const level = getSkillLevel(skill);

    if (level === 0) {
      // add proficiency
      await bus.updateSkillProficiency(character.id, skill, true, false);
    } else if (level === 1) {
      // upgrade to expertise
      await bus.updateSkillProficiency(character.id, skill, true, true);
    } else {
      // remove skill proficiency
      await bus.updateSkillProficiency(character.id, skill, false, false);
    }
  };

  /* ======================================================= */
  /*                         RENDER                          */
  /* ======================================================= */

  return (
    <Card className="w-full border shadow-md border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90">
      <CardHeader className="flex flex-row items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 border rounded-full shadow dark:bg-purple-900/40 border-purple-300/50 dark:border-purple-700/30">
            <Icon className="w-6 h-6 text-purple-700 dark:text-purple-300" />
          </div>

          <div>
            <CardTitle className="text-base font-semibold">{pretty}</CardTitle>

            {/* Roll mode */}
            <ToggleGroup
              type="single"
              value={rollMode}
              onValueChange={(v) => v && setRollMode(v as RollMode)}
              className="mt-1"
            >
              <ToggleGroupItem value="normal" className="text-xs">
                Normal
              </ToggleGroupItem>
              <ToggleGroupItem value="advantage" className="text-xs">
                Adv
              </ToggleGroupItem>
              <ToggleGroupItem value="disadvantage" className="text-xs">
                Disadv
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* RIGHT: SCORE EDIT */}
        <div className="text-right">
          <div className="text-xs text-slate-500">Score</div>

          {!editingScore ? (
            <button
              onClick={() => {
                setLocalScore(score);
                setEditingScore(true);
              }}
              className="text-xl font-bold transition hover:text-purple-400"
            >
              {score}
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <input
                value={localScore}
                onChange={(e) => setLocalScore(parseInt(e.target.value))}
                type="number"
                className="w-12 text-right px-1 py-0.5 rounded bg-slate-800 border border-slate-600"
              />
              <Button size="sm" onClick={saveScore}>
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <Separator className="my-2" />

      <CardContent className="flex flex-col gap-3">
        {/* Modifier */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">Modifier</div>

          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">
              {modifier >= 0 ? `+${modifier}` : modifier}
            </span>

            <Button
              size="sm"
              className="text-white bg-purple-600 hover:bg-purple-700"
              onClick={rollAbilityCheck}
            >
              <Dice5 className="w-4 h-4 mr-1" /> Check
            </Button>
          </div>
        </div>

        {/* Saving throw */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Saving Throw</span>
            <span className="font-semibold">
              {savingThrowBonus >= 0
                ? `+${savingThrowBonus}`
                : savingThrowBonus}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={toggleSavingProficiency}>
              {savingProficient ? (
                <Badge className="text-white bg-purple-600">Proficient</Badge>
              ) : (
                <Badge variant="outline">Not proficient</Badge>
              )}
            </button>

            <Button size="sm" variant="outline" onClick={rollSavingThrow}>
              <Dice5 className="w-4 h-4 mr-1" /> Roll
            </Button>
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <Separator className="my-2" />
            <div className="text-xs font-semibold text-slate-600">Skills</div>

            <div className="flex flex-col gap-1 mt-1">
              {skills.map((skill) => {
                const level = getSkillLevel(skill.key);
                const bonus = getSkillBonus(skill.key);

                return (
                  <motion.div
                    key={skill.key}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between"
                  >
                    <button
                      className="flex items-center gap-2"
                      onClick={() => toggleSkill(skill.key)}
                    >
                      {level === 0 && (
                        <Circle className="w-3 h-3 text-slate-400" />
                      )}
                      {level === 1 && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      )}
                      {level === 2 && (
                        <Star className="w-3 h-3 text-amber-500" />
                      )}
                      <span>{skill.label}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {bonus >= 0 ? `+${bonus}` : bonus}
                      </span>

                      <Button
                        size="icon"
                        variant="outline"
                        className="w-7 h-7"
                        onClick={() => rollSkill(skill.key)}
                      >
                        <Dice5 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
