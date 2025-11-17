"use client";

import { EventType } from "@/types/event";
import type { CharacterResponseDto } from "@/types/character";
import type { CharacterEvent } from "@/contexts/CharacterEventBus";

export interface CharacterEventReducerResult {
  nextCharacter: CharacterResponseDto;
  didUpdate: boolean;
  message?: string;
}

export function applyCharacterEvent(
  prev: CharacterResponseDto,
  event: CharacterEvent,
): CharacterEventReducerResult {
  let next = prev;
  let didUpdate = false;
  let eventMessage = "";
  const { type, payload } = event;

  switch (type) {
    case EventType.LEVEL_UP: {
      const newLevel = (payload as any).newLevel ?? payload.newState?.level;
      if (typeof newLevel === "number" && newLevel !== prev.level) {
        next = { ...prev, level: newLevel };
        eventMessage = `Leveled up to level ${newLevel}`;
        didUpdate = true;
      }
      break;
    }

    case EventType.EXPERIENCE_GAINED: {
      const total = (payload as any).totalExperience;
      const gained = (payload as any).experienceGained;
      if (typeof total === "number") {
        next = { ...prev, experiencePoints: total };
        eventMessage = `Gained ${gained ?? ""} experience points`;
        didUpdate = true;
      }
      break;
    }

    case EventType.ABILITY_SCORE_UPDATED: {
      const abilityKey =
        (payload as any).abilityKey ||
        ((payload as any).ability as string | undefined)?.toLowerCase();
      const newScore = (payload as any).newScore as number | undefined;

      if (payload.newState?.abilityScores) {
        next = { ...prev, abilityScores: payload.newState.abilityScores };
        didUpdate = true;
      } else if (abilityKey && typeof newScore === "number") {
        const abilityScores = { ...(prev.abilityScores ?? {}) } as any;
        abilityScores[abilityKey] = newScore;
        next = { ...prev, abilityScores };
        didUpdate = true;
      }

      if (abilityKey && typeof newScore === "number") {
        eventMessage = `Updated ${abilityKey} ability score to ${newScore}`;
      } else {
        eventMessage = "Ability score updated";
      }
      break;
    }

    case EventType.SAVING_THROW_PROFICIENCY_UPDATED: {
      const ability = (payload as any).ability as string | undefined;
      const proficient = (payload as any).proficient as boolean | undefined;

      if (payload.newState?.savingThrows) {
        next = { ...prev, savingThrows: payload.newState.savingThrows };
        didUpdate = true;
      } else if (ability && typeof proficient === "boolean") {
        const savingThrows = { ...(prev.savingThrows ?? {}) };
        (savingThrows as any)[ability] = proficient;
        next = { ...prev, savingThrows };
        didUpdate = true;
      }

      if (ability) {
        eventMessage = `${
          proficient ? "Added" : "Removed"
        } saving throw proficiency for ${ability}`;
      } else {
        eventMessage = "Saving throw proficiency updated";
      }
      break;
    }

    case EventType.SKILL_PROFICIENCY_ADDED: {
      const skill = (payload as any).skill as string | undefined;
      const proficient = (payload as any).proficient as boolean | undefined;
      const expertise = (payload as any).expertise as boolean | undefined;

      if (payload.newState?.skillProficiencies) {
        next = {
          ...prev,
          skillProficiencies: payload.newState.skillProficiencies,
        };
        didUpdate = true;
      } else {
        const existing = [...(prev.skillProficiencies || [])];
        if (skill) {
          const idx = existing.findIndex((s) => s.skill === skill);
          if (idx >= 0) {
            existing[idx] = {
              ...existing[idx],
              proficient:
                typeof proficient === "boolean"
                  ? proficient
                  : existing[idx].proficient,
              expertise:
                typeof expertise === "boolean"
                  ? expertise
                  : existing[idx].expertise,
            };
          } else {
            existing.push({
              id: skill,
              skill,
              proficient: !!proficient,
              expertise: !!expertise,
            });
          }
          next = { ...prev, skillProficiencies: existing };
          didUpdate = true;
        }
      }

      if (skill) {
        const profLevel =
          expertise && proficient
            ? "expertise"
            : proficient
            ? "proficiency"
            : "no proficiency";
        eventMessage = `Updated ${skill} to ${profLevel}`;
      } else {
        eventMessage = "Skill proficiency updated";
      }
      break;
    }

    case EventType.DAMAGE_APPLIED: {
      const damage = (payload as any).damage ?? 0;
      if (prev.hitPoints) {
        next = {
          ...prev,
          hitPoints: {
            ...prev.hitPoints,
            current: Math.max(0, prev.hitPoints.current - damage),
          },
        };
        didUpdate = true;
        eventMessage = `Took ${damage} damage`;
      }
      break;
    }

    case EventType.HEALING_RECEIVED: {
      const healing = (payload as any).healing ?? 0;
      if (prev.hitPoints) {
        next = {
          ...prev,
          hitPoints: {
            ...prev.hitPoints,
            current: Math.min(
              prev.hitPoints.max,
              prev.hitPoints.current + healing,
            ),
          },
        };
        didUpdate = true;
        eventMessage = `Received ${healing} healing`;
      }
      break;
    }

    case EventType.QUEST_FINISHED: {
      const reward = (payload as any).experienceReward ?? 0;
      const goldReward = (payload as any).goldReward ?? 0;
      const experiencePoints = (prev.experiencePoints ?? 0) + reward;

      const currency = prev.currency
        ? {
            ...prev.currency,
            gp: (prev.currency.gp ?? 0) + goldReward,
          }
        : undefined;

      next = { ...prev, experiencePoints, currency };
      didUpdate = true;
      eventMessage = `Quest finished (+${reward} XP, +${goldReward} GP)`;
      break;
    }

    case EventType.CHARACTER_UPDATED: {
      if (payload.newState) {
        next = { ...prev, ...(payload.newState as CharacterResponseDto) };
        didUpdate = true;
      } else if (payload.changes) {
        next = {
          ...prev,
          ...(payload.changes as Partial<CharacterResponseDto>),
        };
        didUpdate = true;
      }
      eventMessage = "Character updated";
      break;
    }

    default:
      break;
  }

  return {
    nextCharacter: next,
    didUpdate,
    message: eventMessage,
  };
}
