"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { EventHandler, EventFilter, BaseEvent, EventType } from "@/types/event";
import {
  CharacterResponseDto,
  UpdateCharacterDto,
  CreateCharacterDto,
} from "@/types/character";
import { characterApi } from "@/lib/api/character";

/**
 * Payload dla eventów charakteru
 */
export interface CharacterEventPayload {
  characterId?: string;
  previousState?: CharacterResponseDto;
  newState?: CharacterResponseDto;
  changes?: Partial<CharacterResponseDto>;
  validationErrors?: string[];
  metadata?: Record<string, any>;
}

/**
 * Event dla charakteru – typ *tylko* EventType
 */
export interface CharacterEvent extends BaseEvent {
  type: EventType;
  payload: CharacterEventPayload & BaseEvent["payload"];
}

/**
 * Historia eventów dla undo/redo (na poziomie EventBus)
 */
export interface CharacterEventHistory {
  events: CharacterEvent[];
  currentIndex: number;
  maxHistorySize: number;
}

/**
 * Filter używany przy subskrypcjach
 */
export interface CharacterEventFilter extends EventFilter {
  characterId?: string;
  operationType?: "create" | "update" | "delete" | "validation";
  metadata?: Record<string, any>;
}

/**
 * Kontekst EventBusa
 */
interface CharacterEventBusContextType {
  // Eventy
  publishEvent: (event: CharacterEvent) => Promise<void>;
  subscribe: (
    handler: EventHandler<CharacterEvent>,
    filter?: CharacterEventFilter,
  ) => () => void;

  // Operacje na postaci
  createCharacter: (
    characterData: CreateCharacterDto,
  ) => Promise<CharacterResponseDto>;
  updateCharacter: (
    id: string,
    updates: UpdateCharacterDto,
  ) => Promise<CharacterResponseDto>;
  deleteCharacter: (id: string) => Promise<void>;
  validateCharacter: (characterData: Partial<CharacterResponseDto>) => {
    valid: boolean;
    errors: string[];
  };

  // Ability / profki
  updateAbilityScore: (
    characterId: string,
    ability: string,
    newScore: number,
  ) => Promise<CharacterResponseDto>;

  updateSavingThrowProficiency: (
    characterId: string,
    ability: string,
    proficient: boolean,
  ) => Promise<CharacterResponseDto>;

  updateSkillProficiency: (
    characterId: string,
    skill: string,
    proficient: boolean,
    expertise: boolean,
  ) => Promise<void>;

  // Historia eventów
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  getHistory: () => CharacterEventHistory;

  // Operacje bulk / analityka
  bulkUpdateCharacters: (
    operations: { id: string; updates: UpdateCharacterDto }[],
  ) => Promise<CharacterResponseDto[]>;
  compareCharacters: (
    characterIds: string[],
  ) => Promise<Record<string, Partial<CharacterResponseDto>>>;
  getEventStats: () => {
    totalEvents: number;
    eventsByType: Record<EventType, number>;
    recentEvents: CharacterEvent[];
  };
}

const CharacterEventBusContext = createContext<
  CharacterEventBusContextType | undefined
>(undefined);

/**
 * Implementacja EventBusa
 */
class CharacterEventBus {
  private handlers: Map<
    string,
    { handler: EventHandler<CharacterEvent>; filter?: CharacterEventFilter }
  > = new Map();

  private eventHistory: CharacterEventHistory = {
    events: [],
    currentIndex: -1,
    maxHistorySize: 50,
  };

  subscribe(
    handler: EventHandler<CharacterEvent>,
    filter?: CharacterEventFilter,
  ): () => void {
    const id = Math.random().toString(36).slice(2);
    this.handlers.set(id, { handler, filter });
    return () => this.handlers.delete(id);
  }

  private matchesFilter(
    event: CharacterEvent,
    filter?: CharacterEventFilter,
  ): boolean {
    if (!filter) return true;

    const payload = event.payload || {};

    // Filtrowanie po type (z EventFilter)
    if ((filter as any).type) {
      const fType = (filter as any).type as EventType | EventType[] | undefined;
      if (Array.isArray(fType)) {
        if (!fType.includes(event.type)) return false;
      } else if (fType && event.type !== fType) {
        return false;
      }
    }

    // Filtrowanie po global/campaignId/targetId (z BaseEvent)
    if ((filter as any).global !== undefined) {
      if (event.global !== (filter as any).global) return false;
    }
    if ((filter as any).campaignId) {
      if (event.campaignId !== (filter as any).campaignId) return false;
    }
    if ((filter as any).targetId) {
      if ((event as any).targetId !== (filter as any).targetId) return false;
    }

    // Rozszerzenie filtrem charakteru
    if (filter.characterId && payload.characterId !== filter.characterId) {
      return false;
    }

    if (
      filter.operationType &&
      payload.metadata?.operationType !== filter.operationType
    ) {
      return false;
    }

    if (filter.metadata) {
      const meta = payload.metadata ?? {};
      for (const [key, value] of Object.entries(filter.metadata)) {
        if (meta[key] !== value) return false;
      }
    }

    return true;
  }

  async publishEvent(event: CharacterEvent): Promise<void> {
    if (!event.timestamp) {
      event.timestamp = new Date();
    }

    this.addToHistory(event);

    const promises: Promise<void>[] = [];

    for (const [id, { handler, filter }] of this.handlers) {
      if (!this.matchesFilter(event, filter)) continue;
      try {
        const res = handler(event);
        if (res instanceof Promise) promises.push(res);
      } catch (err) {
        console.error(`Error in character event handler ${id}:`, err);
      }
    }

    await Promise.allSettled(promises);
  }

  private addToHistory(event: CharacterEvent) {
    if (this.eventHistory.currentIndex < this.eventHistory.events.length - 1) {
      this.eventHistory.events = this.eventHistory.events.slice(
        0,
        this.eventHistory.currentIndex + 1,
      );
    }

    this.eventHistory.events.push(event);
    this.eventHistory.currentIndex++;

    if (this.eventHistory.events.length > this.eventHistory.maxHistorySize) {
      this.eventHistory.events = this.eventHistory.events.slice(
        -this.eventHistory.maxHistorySize,
      );
      this.eventHistory.currentIndex = this.eventHistory.events.length - 1;
    }
  }

  undo() {
    if (!this.canUndo()) return;
    this.eventHistory.currentIndex--;
    const event = this.eventHistory.events[this.eventHistory.currentIndex];
    this.publishEvent({
      ...event,
      type: this.getInverseEventType(event.type),
    } as CharacterEvent);
  }

  redo() {
    if (!this.canRedo()) return;
    this.eventHistory.currentIndex++;
    const event = this.eventHistory.events[this.eventHistory.currentIndex];
    this.publishEvent(event);
  }

  canUndo() {
    return this.eventHistory.currentIndex > 0;
  }

  canRedo() {
    return (
      this.eventHistory.currentIndex >= 0 &&
      this.eventHistory.currentIndex < this.eventHistory.events.length - 1
    );
  }

  getHistory(): CharacterEventHistory {
    return { ...this.eventHistory };
  }

  getEventStats() {
    const { events } = this.eventHistory;
    const recentEvents = events.slice(-10);
    const eventsByType = events.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<EventType, number>);
    return {
      totalEvents: events.length,
      eventsByType,
      recentEvents,
    };
  }

  private getInverseEventType(type: EventType): EventType {
    const inverseMap: Partial<Record<EventType, EventType>> = {
      [EventType.CHARACTER_CREATED]: EventType.CHARACTER_DELETED,
      [EventType.CHARACTER_DELETED]: EventType.CHARACTER_CREATED,
      [EventType.DAMAGE_APPLIED]: EventType.HEALING_RECEIVED,
      [EventType.HEALING_RECEIVED]: EventType.DAMAGE_APPLIED,
      [EventType.CHARACTER_UPDATED]: EventType.CHARACTER_UPDATED,
    };
    return inverseMap[type] ?? type;
  }
}

/**
 * Provider
 */
export function CharacterEventBusProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [eventBus] = useState(() => new CharacterEventBus());

  const createCharacter = useCallback(
    async (
      characterData: CreateCharacterDto,
    ): Promise<CharacterResponseDto> => {
      try {
        const validation = validateCharacterData(characterData as any);
        if (!validation.valid) {
          throw new Error(validation.errors.join(", "));
        }

        const newCharacter = await characterApi.create(characterData);

        await eventBus.publishEvent({
          type: EventType.CHARACTER_CREATED,
          campaignId: newCharacter.campaignId,
          timestamp: new Date(),
          payload: {
            characterId: newCharacter.id,
            newState: newCharacter,
            metadata: { source: "character-creation" },
          },
        } as CharacterEvent);

        return newCharacter;
      } catch (error) {
        await eventBus.publishEvent({
          type: EventType.ERROR_OCCURRED,
          global: true,
          timestamp: new Date(),
          payload: {
            error: error instanceof Error ? error.message : "Unknown error",
            context: { operation: "createCharacter", characterData },
            metadata: { severity: "error" },
          },
        } as CharacterEvent);
        throw error;
      }
    },
    [eventBus],
  );

  const updateCharacter = useCallback(
    async (
      id: string,
      updates: UpdateCharacterDto,
    ): Promise<CharacterResponseDto> => {
      try {
        const currentCharacter = await characterApi.getById(id);
        const validation = validateCharacterData({
          ...currentCharacter,
          ...updates,
        } as any);

        if (!validation.valid) {
          throw new Error(validation.errors.join(", "));
        }

        const updatedCharacter = await characterApi.update(id, updates);

        await eventBus.publishEvent({
          type: EventType.CHARACTER_UPDATED,
          campaignId: updatedCharacter.campaignId,
          timestamp: new Date(),
          payload: {
            characterId: id,
            previousState: currentCharacter,
            newState: updatedCharacter,
            changes: updates as any,
            metadata: {
              source: "character-dashboard",
              operationType: "update",
            },
          },
        } as CharacterEvent);

        return updatedCharacter;
      } catch (error) {
        await eventBus.publishEvent({
          type: EventType.ERROR_OCCURRED,
          global: true,
          timestamp: new Date(),
          payload: {
            error: error instanceof Error ? error.message : "Unknown error",
            context: { operation: "updateCharacter", characterId: id, updates },
            metadata: { severity: "error" },
          },
        } as CharacterEvent);
        throw error;
      }
    },
    [eventBus],
  );

  const deleteCharacter = useCallback(
    async (id: string): Promise<void> => {
      try {
        const existing = await characterApi.getById(id);
        await characterApi.delete(id);

        await eventBus.publishEvent({
          type: EventType.CHARACTER_DELETED,
          campaignId: existing.campaignId,
          timestamp: new Date(),
          payload: {
            characterId: id,
            previousState: existing,
            metadata: {
              source: "character-dashboard",
              operationType: "delete",
            },
          },
        } as CharacterEvent);
      } catch (error) {
        await eventBus.publishEvent({
          type: EventType.ERROR_OCCURRED,
          global: true,
          timestamp: new Date(),
          payload: {
            error: error instanceof Error ? error.message : "Unknown error",
            context: { operation: "deleteCharacter", characterId: id },
            metadata: { severity: "error" },
          },
        } as CharacterEvent);
        throw error;
      }
    },
    [eventBus],
  );

  const validateCharacter = useCallback(
    (characterData: Partial<CharacterResponseDto>) => {
      const result = validateCharacterData(characterData);
      return { valid: result.valid, errors: result.errors };
    },
    [],
  );

  const bulkUpdateCharacters = useCallback(
    async (
      operations: { id: string; updates: UpdateCharacterDto }[],
    ): Promise<CharacterResponseDto[]> => {
      const results: CharacterResponseDto[] = [];

      for (const op of operations) {
        try {
          const updated = await characterApi.update(op.id, op.updates);
          results.push(updated);

          await eventBus.publishEvent({
            type: EventType.CHARACTER_UPDATED,
            campaignId: updated.campaignId,
            timestamp: new Date(),
            payload: {
              characterId: op.id,
              changes: op.updates as any,
              newState: updated,
              metadata: {
                source: "bulk-update",
                operationType: "update",
              },
            },
          } as CharacterEvent);
        } catch (error) {
          console.error(`Bulk update failed for character ${op.id}`, error);
        }
      }

      return results;
    },
    [eventBus],
  );

  const compareCharacters = useCallback(
    async (
      characterIds: string[],
    ): Promise<Record<string, Partial<CharacterResponseDto>>> => {
      const comparisons: Record<string, Partial<CharacterResponseDto>> = {};

      for (const id of characterIds) {
        try {
          const ch = await characterApi.getById(id);
          comparisons[id] = ch;
        } catch (error) {
          console.error(`Failed to load character ${id} for compare`, error);
          comparisons[id] = {};
        }
      }

      return comparisons;
    },
    [],
  );

  const updateAbilityScore = useCallback(
    async (
      characterId: string,
      ability: string,
      newScore: number,
    ): Promise<CharacterResponseDto> => {
      try {
        const current = await characterApi.getById(characterId);
        const abilityScores = current.abilityScores ?? {};
        const oldScore =
          abilityScores[ability as keyof typeof abilityScores] ?? 10;

        const updated = await characterApi.update(characterId, {
          abilityScores: {
            ...abilityScores,
            [ability]: newScore,
          },
        });

        const oldModifier = Math.floor((oldScore - 10) / 2);
        const newModifier = Math.floor((newScore - 10) / 2);
        const modifierChange = newModifier - oldModifier;

        await eventBus.publishEvent({
          type: EventType.ABILITY_SCORE_UPDATED,
          campaignId: updated.campaignId,
          timestamp: new Date(),
          payload: {
            characterId,
            ability,
            oldScore,
            newScore,
            modifierChange,
            previousState: current,
            newState: updated,
            metadata: { source: "ability-card", operationType: "update" },
          },
        } as CharacterEvent);

        return updated;
      } catch (error) {
        await eventBus.publishEvent({
          type: EventType.ERROR_OCCURRED,
          global: true,
          timestamp: new Date(),
          payload: {
            error: error instanceof Error ? error.message : "Unknown error",
            context: {
              operation: "updateAbilityScore",
              characterId,
              ability,
              newScore,
            },
            metadata: { severity: "error" },
          },
        } as CharacterEvent);
        throw error;
      }
    },
    [eventBus],
  );

  const updateSavingThrowProficiency = useCallback(
    async (
      characterId: string,
      ability: string,
      proficient: boolean,
    ): Promise<CharacterResponseDto> => {
      try {
        const current = await characterApi.getById(characterId);
        const updated = await characterApi.update(characterId, {
          savingThrows: {
            ...current.savingThrows,
            [ability]: proficient,
          },
        });

        await eventBus.publishEvent({
          type: EventType.SAVING_THROW_PROFICIENCY_UPDATED,
          campaignId: updated.campaignId,
          timestamp: new Date(),
          payload: {
            characterId,
            ability,
            proficient,
            previousState: current,
            newState: updated,
            metadata: { source: "saving-throws-card", operationType: "update" },
          },
        } as CharacterEvent);

        return updated;
      } catch (error) {
        await eventBus.publishEvent({
          type: EventType.ERROR_OCCURRED,
          global: true,
          timestamp: new Date(),
          payload: {
            error: error instanceof Error ? error.message : "Unknown error",
            context: {
              operation: "updateSavingThrowProficiency",
              characterId,
              ability,
              proficient,
            },
            metadata: { severity: "error" },
          },
        } as CharacterEvent);
        throw error;
      }
    },
    [eventBus],
  );

  const updateSkillProficiency = useCallback(
    async (
      characterId: string,
      skill: string,
      proficient: boolean,
      expertise: boolean,
    ): Promise<void> => {
      try {
        const previous = await characterApi.getById(characterId);

        await characterApi.updateSkillProficiency(
          characterId,
          skill,
          proficient,
          expertise,
        );

        const updated = await characterApi.getById(characterId);

        await eventBus.publishEvent({
          type: EventType.SKILL_PROFICIENCY_ADDED,
          campaignId: updated.campaignId,
          timestamp: new Date(),
          payload: {
            characterId,
            skill,
            proficient,
            expertise,
            previousState: previous,
            newState: updated,
            metadata: { source: "skills-card", operationType: "update" },
          },
        } as CharacterEvent);
      } catch (error) {
        await eventBus.publishEvent({
          type: EventType.ERROR_OCCURRED,
          global: true,
          timestamp: new Date(),
          payload: {
            error: error instanceof Error ? error.message : "Unknown error",
            context: {
              operation: "updateSkillProficiency",
              characterId,
              skill,
              proficient,
              expertise,
            },
            metadata: { severity: "error" },
          },
        } as CharacterEvent);
        throw error;
      }
    },
    [eventBus],
  );

  const value: CharacterEventBusContextType = {
    publishEvent: eventBus.publishEvent.bind(eventBus),
    subscribe: eventBus.subscribe.bind(eventBus),
    createCharacter,
    updateCharacter,
    deleteCharacter,
    validateCharacter,
    updateAbilityScore,
    updateSavingThrowProficiency,
    updateSkillProficiency,
    undo: eventBus.undo.bind(eventBus),
    redo: eventBus.redo.bind(eventBus),
    getHistory: eventBus.getHistory.bind(eventBus),
    bulkUpdateCharacters,
    compareCharacters,
    getEventStats: eventBus.getEventStats.bind(eventBus),

    // "dynamiczne" bo czytane z eventBusu
    get canUndo() {
      return eventBus.canUndo();
    },
    get canRedo() {
      return eventBus.canRedo();
    },
  };

  return (
    <CharacterEventBusContext.Provider value={value}>
      {children}
    </CharacterEventBusContext.Provider>
  );
}

/**
 * Hook – dostęp do EventBusa
 */
export function useCharacterEventBus() {
  const ctx = useContext(CharacterEventBusContext);
  if (!ctx) {
    throw new Error(
      "useCharacterEventBus must be used within a CharacterEventBusProvider",
    );
  }
  return ctx;
}

/**
 * Hook – prosty wrapper na subscribe
 */
export function useCharacterEvents(
  handler: EventHandler<CharacterEvent>,
  filter?: CharacterEventFilter,
) {
  const bus = useCharacterEventBus();

  useEffect(() => {
    const unsubscribe = bus.subscribe(handler, filter);
    return unsubscribe;
  }, [bus, handler, filter]);
}

/**
 * Wspólna walidacja – możesz jej używać też poza Dashboardem
 */
export function validateCharacterData(
  characterData: Partial<CharacterResponseDto>,
): { valid: boolean; errors: string[]; warnings?: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!characterData.name?.trim()) {
    errors.push("Character name is required");
  }
  if (!characterData.race) {
    errors.push("Character race is required");
  }
  if (
    !characterData.level ||
    characterData.level < 1 ||
    characterData.level > 20
  ) {
    errors.push("Character level must be between 1 and 20");
  }

  if (!characterData.abilityScores) {
    errors.push("Ability scores are required");
  } else {
    for (const [ability, score] of Object.entries(
      characterData.abilityScores,
    )) {
      if (typeof score !== "number") continue;
      if (score < 3 || score > 20) {
        errors.push(`${ability} must be between 3 and 20`);
      }
      if (!Number.isInteger(score)) {
        errors.push(`${ability} must be an integer`);
      }
    }
  }

  if (!characterData.hitPoints) {
    errors.push("Hit points are required");
  } else {
    const hp = characterData.hitPoints;
    if (hp.max < 1) errors.push("Max HP must be at least 1");
    if (hp.current < 0) errors.push("Current HP cannot be negative");
    if (hp.temporary < 0) errors.push("Temporary HP cannot be negative");
  }

  if (characterData.currency) {
    for (const [type, amount] of Object.entries(characterData.currency)) {
      if (typeof amount === "number" && amount < 0) {
        errors.push(`${type} currency cannot be negative`);
      }
    }
  }

  if (
    characterData.level &&
    characterData.level > 1 &&
    !characterData.abilityScores
  ) {
    warnings.push("High-level characters should have defined ability scores");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length ? warnings : [],
  };
}
