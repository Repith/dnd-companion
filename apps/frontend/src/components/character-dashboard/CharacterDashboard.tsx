"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CharacterResponseDto, UpdateCharacterDto } from "@/types/character";
import { EventType } from "@/types/event";
import { calculateProficiencyBonus } from "./utils";
import { CharacterHeader } from "./CharacterHeader";
import { CharacterTabs } from "./CharacterTabs";
import { OverviewTab } from "./tabs/OverviewTab";
import { DiceRadialMenu } from "../DiceRadialMenu";
import { SpellSlotTracker } from "../SpellSlotTracker";
import { Spellbook } from "../Spellbook";
import { Features } from "../Features";
import RollHistory from "../RollHistory";
import { eventApi } from "@/lib/api/event";
import {
  useCharacterEventBus,
  useCharacterEvents,
  validateCharacterData,
  type CharacterEvent,
} from "@/contexts/CharacterEventBus";
import { useCharacter } from "@/contexts/CharacterContext";
import { DashboardHeader } from "./DashboardHeader";
import { ConnectionStatusBanner } from "./ConnectionStatusBanner";

export interface CharacterDashboardProps {
  character: CharacterResponseDto;
  onUpdate?: (updates: Partial<CharacterResponseDto>) => void;
}

type CharacterTab =
  | "overview"
  | "spells"
  | "features"
  | "rolls"
  | "inventory"
  | "notes"
  | "comparison";

interface CharacterDashboardState {
  hasUnsavedChanges: boolean;
  lastSavedData: Partial<CharacterResponseDto>;
  editMode: boolean;
  comparisonMode: boolean;
  comparedCharacters: string[];
  undoRedoStack: {
    undo: Array<() => Promise<void>>;
    redo: Array<() => Promise<void>>;
  };
  isValidating: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  characterStats: {
    totalUpdates: number;
    lastModified: Date | null;
    version: number;
  };
}

export default function CharacterDashboard({
  character,
  onUpdate,
}: CharacterDashboardProps) {
  const { publishEvent, updateCharacter, getEventStats } =
    useCharacterEventBus();
  const { setSelectedCharacter } = useCharacter();

  const [activeTab, setActiveTab] = useState<CharacterTab>("overview");
  const [localCharacter, setLocalCharacter] = useState(character);
  const [recentEvents, setRecentEvents] = useState<string[]>([]);
  const [sseDisabled, setSseDisabled] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [lastEventTimestamp, setLastEventTimestamp] = useState<string | null>(
    null,
  );
  const [attemptHistory, setAttemptHistory] = useState<
    Array<{ timestamp: string; type: string; details: any }>
  >([]);

  const [state, setState] = useState<CharacterDashboardState>({
    hasUnsavedChanges: false,
    lastSavedData: character,
    editMode: false,
    comparisonMode: false,
    comparedCharacters: [],
    undoRedoStack: { undo: [], redo: [] },
    isValidating: false,
    validationErrors: [],
    validationWarnings: [],
    characterStats: {
      totalUpdates: 0,
      lastModified: null,
      version: 1,
    },
  });

  const characterCache = useRef<Map<string, CharacterResponseDto>>(new Map());
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalCharacter(character);
    setState((prev) => ({
      ...prev,
      lastSavedData: character,
      hasUnsavedChanges: false,
    }));
    setSseDisabled(false);
    setIsPolling(false);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setLastEventTimestamp(null);
    setAttemptHistory([]);
    setSelectedCharacter(character);
    characterCache.current.set(character.id, character);
  }, [character, setSelectedCharacter]);

  /**
   * Real-time validation with debouncing
   */
  useEffect(() => {
    if (state.editMode && validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(() => {
      const validation = validateCharacterData(localCharacter);
      setState((prev) => ({
        ...prev,
        isValidating: false,
        validationErrors: validation.errors,
        validationWarnings: validation.warnings ?? [],
      }));
    }, 500);

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [localCharacter, state.editMode]);

  const pollEvents = async () => {
    try {
      const response = await eventApi.getCharacterEvents(localCharacter.id, {
        limit: 50,
        offset: 0,
      });
      const events = response.events;

      const newEvents = lastEventTimestamp
        ? events.filter(
            (event: any) =>
              new Date(event.timestamp) > new Date(lastEventTimestamp),
          )
        : events;

      for (const event of newEvents) {
        await publishEvent({
          ...event,
          timestamp:
            typeof event.timestamp === "string"
              ? new Date(event.timestamp)
              : event.timestamp ?? new Date(),
        } as CharacterEvent);
      }

      if (newEvents.length > 0) {
        const last = newEvents[newEvents.length - 1].timestamp;
        setLastEventTimestamp(
          typeof last === "string" ? last : new Date(last).toISOString(),
        );
      }
    } catch (error) {
      console.error("Failed to poll events:", error);
    }
  };

  useEffect(() => {
    if (sseDisabled && !isPolling) {
      setIsPolling(true);
      const interval = setInterval(pollEvents, 10000);
      setPollingInterval(interval);
      return () => clearInterval(interval);
    }

    if (sseDisabled || isPolling) return;

    let eventSource: EventSource | null = null;
    let retryCount = 0;
    const maxRetries = 10;
    let retryDelay = 1000;
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3002";

    const connect = () => {
      const timestamp = new Date().toISOString();
      try {
        const token =
          localStorage.getItem("access_token") || localStorage.getItem("token");
        const url = token
          ? `${backendUrl}/events/character/${
              localCharacter.id
            }/stream?token=${encodeURIComponent(token)}`
          : `${backendUrl}/events/character/${localCharacter.id}/stream`;

        eventSource = new EventSource(url);

        eventSource.onopen = () => {
          console.log(
            `[${timestamp}] EventSource connection opened successfully`,
          );
          retryCount = 0;
          setAttemptHistory((prev) =>
            [
              ...prev,
              {
                timestamp,
                type: "connection_opened",
                details: { readyState: eventSource?.readyState },
              },
            ].slice(-20),
          );
        };

        eventSource.onmessage = (event) => {
          try {
            const raw = JSON.parse(event.data);
            publishEvent({
              ...raw,
              timestamp:
                typeof raw.timestamp === "string"
                  ? new Date(raw.timestamp)
                  : raw.timestamp ?? new Date(),
            } as CharacterEvent);
          } catch (error) {
            console.error(
              `[${new Date().toISOString()}] Failed to parse event:`,
              error,
            );
          }
        };

        eventSource.onerror = (event) => {
          const es = event.target as EventSource | null;

          const now = new Date().toISOString();

          const errorDetails = {
            type: event.type,
            readyState: es?.readyState,
            url: (es as any)?.url,
            retryCount,
          };

          console.error(`[${now}] EventSource connection error`, {
            rawEvent: event,
            ...errorDetails,
          });

          setAttemptHistory((prev) =>
            [
              ...prev,
              { timestamp, type: "connection_error", details: errorDetails },
            ].slice(-20),
          );

          if (eventSource) {
            eventSource.close();
          }
          if (retryCount < maxRetries) {
            retryCount++;
            const jitter = Math.random() * 0.1 * retryDelay;
            const delayWithJitter = retryDelay + jitter;
            retryDelay = Math.min(retryDelay * 2, 30000);

            console.log(
              `[${timestamp}] Retrying EventSource connection in ${delayWithJitter.toFixed(
                0,
              )}ms (attempt ${retryCount}/${maxRetries})`,
            );
            setTimeout(connect, delayWithJitter);
          } else {
            console.error(
              `[${timestamp}] Max retries (${maxRetries}) reached for EventSource connection. Switching to polling mode.`,
            );
            setSseDisabled(true);
            setIsPolling(true);
            const interval = setInterval(pollEvents, 10000);
            setPollingInterval(interval);
          }
        };
      } catch (error) {
        const errorDetails = { error: (error as any).message || String(error) };
        console.error(
          `[${timestamp}] Failed to create EventSource:`,
          errorDetails,
        );

        setAttemptHistory((prev) =>
          [
            ...prev,
            { timestamp, type: "creation_error", details: errorDetails },
          ].slice(-20),
        );

        if (retryCount < maxRetries) {
          retryCount++;
          const jitter = Math.random() * 0.1 * retryDelay;
          const delayWithJitter = retryDelay + jitter;
          retryDelay = Math.min(retryDelay * 2, 30000);

          console.log(
            `[${timestamp}] Retrying EventSource creation in ${delayWithJitter.toFixed(
              0,
            )}ms (attempt ${retryCount}/${maxRetries})`,
          );
          setTimeout(connect, delayWithJitter);
        } else {
          console.error(
            `[${timestamp}] Max retries (${maxRetries}) reached for EventSource creation. Switching to polling mode.`,
          );
          setSseDisabled(true);
          setIsPolling(true);
          const interval = setInterval(pollEvents, 10000);
          setPollingInterval(interval);
        }
      }
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [localCharacter.id, sseDisabled, isPolling, publishEvent]);

  /**
   * Enhanced event handling with comprehensive character updates
   * – obejmuje ability, saving throw i skille, tak żeby skille/rzuty
   * przeliczały się poprawnie.
   */
  const handleEvent = useCallback(
    (event: CharacterEvent) => {
      const { type, payload } = event;
      let updates: Partial<CharacterResponseDto> = {};
      let eventMessage = "";

      switch (type) {
        case EventType.LEVEL_UP: {
          const newLevel = (payload as any).newLevel ?? payload.newState?.level;
          if (typeof newLevel === "number") {
            updates.level = newLevel;
            eventMessage = `Leveled up to level ${newLevel}`;
          }
          break;
        }
        case EventType.EXPERIENCE_GAINED: {
          const total = (payload as any).totalExperience;
          const gained = (payload as any).experienceGained;
          if (typeof total === "number") {
            updates.experiencePoints = total;
            eventMessage = `Gained ${gained ?? ""} experience points`;
          }
          break;
        }
        case EventType.ABILITY_SCORE_UPDATED: {
          const ability = (payload as any).ability as string | undefined;
          const newScore = (payload as any).newScore as number | undefined;

          if (payload.newState?.abilityScores) {
            updates.abilityScores = payload.newState.abilityScores;
          } else if (ability && typeof newScore === "number") {
            const currentScores = localCharacter.abilityScores ?? {};
            updates.abilityScores = {
              ...currentScores,
              [ability]: newScore,
            } as any;
          }

          if (ability && typeof newScore === "number") {
            eventMessage = `Updated ${ability} ability score to ${newScore}`;
          } else {
            eventMessage = "Ability score updated";
          }
          break;
        }
        case EventType.SAVING_THROW_PROFICIENCY_UPDATED: {
          const ability = (payload as any).ability as string | undefined;
          const proficient = (payload as any).proficient as boolean | undefined;

          if (payload.newState?.savingThrows) {
            updates.savingThrows = payload.newState.savingThrows;
          } else if (ability && typeof proficient === "boolean") {
            const currentSavingThrows = localCharacter.savingThrows ?? {};
            updates.savingThrows = {
              ...currentSavingThrows,
              [ability]: proficient,
            };
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
          if (payload.newState?.skillProficiencies) {
            updates.skillProficiencies = payload.newState.skillProficiencies;
          } else {
            const existingSkills = [
              ...(localCharacter.skillProficiencies || []),
            ];
            const skill = (payload as any).skill as string;
            const proficient = (payload as any).proficient as boolean;
            const expertise = (payload as any).expertise as boolean;

            const idx = existingSkills.findIndex((s) => s.skill === skill);
            if (idx >= 0) {
              existingSkills[idx] = {
                ...existingSkills[idx],
                proficient,
                expertise,
              };
            } else if (skill) {
              existingSkills.push({
                id: skill,
                skill,
                proficient,
                expertise,
              });
            }
            updates.skillProficiencies = existingSkills;
          }

          const skillName = (payload as any).skill as string | undefined;
          if (skillName) {
            const profLevel = (payload as any).expertise
              ? "expertise"
              : (payload as any).proficient
              ? "proficiency"
              : "no proficiency";
            eventMessage = `Updated ${skillName} to ${profLevel}`;
          } else {
            eventMessage = "Skill proficiency updated";
          }
          break;
        }
        case EventType.DAMAGE_APPLIED: {
          const damage = (payload as any).damage ?? 0;
          if (localCharacter.hitPoints) {
            updates.hitPoints = {
              ...localCharacter.hitPoints,
              current: Math.max(0, localCharacter.hitPoints.current - damage),
            };
          }
          eventMessage = `Took ${damage} damage`;
          break;
        }
        case EventType.HEALING_RECEIVED: {
          const healing = (payload as any).healing ?? 0;
          if (localCharacter.hitPoints) {
            updates.hitPoints = {
              ...localCharacter.hitPoints,
              current: Math.min(
                localCharacter.hitPoints.max,
                localCharacter.hitPoints.current + healing,
              ),
            };
          }
          eventMessage = `Received ${healing} healing`;
          break;
        }
        case EventType.QUEST_FINISHED: {
          const reward = (payload as any).experienceReward ?? 0;
          updates.experiencePoints =
            (localCharacter.experiencePoints || 0) + reward;
          eventMessage = `Completed quest, gained ${reward} experience`;
          break;
        }
        case EventType.CHARACTER_UPDATED:
        case "CHARACTER_UPDATED":
          if (payload.newState) {
            updates = payload.newState;
            eventMessage = `Character updated via ${
              payload.metadata?.source || "event"
            }`;
          }
          break;
        case EventType.CHARACTER_CREATED:
        case "CHARACTER_CREATED":
          if (payload.newState) {
            updates = payload.newState;
            eventMessage = "Character created";
          }
          break;
        case EventType.CHARACTER_DELETED:
        case "CHARACTER_DELETED":
          eventMessage = "Character deleted";
          break;
        default:
          eventMessage = `${String(type)} event occurred`;
      }

      if (Object.keys(updates).length > 0) {
        setLocalCharacter((prev) => {
          const next = { ...prev, ...updates };
          characterCache.current.set(next.id, next);
          onUpdate?.(next);
          return next;
        });

        setState((prev) => ({
          ...prev,
          hasUnsavedChanges: false,
          lastSavedData: { ...prev.lastSavedData, ...updates },
          characterStats: {
            ...prev.characterStats,
            totalUpdates: prev.characterStats.totalUpdates + 1,
            lastModified: new Date(),
          },
        }));
      }

      if (eventMessage) {
        setRecentEvents((prev) => [eventMessage, ...prev].slice(0, 10));
      }
    },
    [localCharacter, onUpdate],
  );

  useCharacterEvents(handleEvent, { characterId: localCharacter.id });

  const proficiencyBonus = calculateProficiencyBonus(localCharacter.level);

  /**
   * Enhanced character update with undo/redo support
   * – korzysta z EventBus, nie z bezpośredniego wywołania API.
   */
  const handleUpdate = useCallback(
    async (updates: UpdateCharacterDto) => {
      const characterId = localCharacter.id;
      const previousState = { ...localCharacter };

      try {
        const updatedCharacter = await updateCharacter(characterId, updates);

        setState((prev) => ({
          ...prev,
          undoRedoStack: {
            ...prev.undoRedoStack,
            undo: [
              ...prev.undoRedoStack.undo,
              async () => {
                await updateCharacter(
                  characterId,
                  previousState as unknown as UpdateCharacterDto,
                );
              },
            ].slice(-50),
            redo: [],
          },
          hasUnsavedChanges: false,
          lastSavedData: updatedCharacter,
        }));

        onUpdate?.(updatedCharacter);
        characterCache.current.set(characterId, updatedCharacter);
      } catch (error) {
        console.error("Failed to update character:", error);
        setState((prev) => ({
          ...prev,
          validationErrors: [
            ...prev.validationErrors,
            error instanceof Error
              ? error.message
              : "Failed to update character",
          ],
        }));
      }
    },
    [localCharacter, onUpdate, updateCharacter],
  );

  /**
   * Undo/Redo functionality
   */
  const undo = useCallback(async () => {
    setState((prev) => {
      const operation = prev.undoRedoStack.undo.pop();
      if (operation) {
        const newState = {
          ...prev,
          undoRedoStack: {
            ...prev.undoRedoStack,
            redo: [...prev.undoRedoStack.redo, operation].slice(-50),
          },
        };

        operation();
        return newState;
      }
      return prev;
    });
  }, []);

  const redo = useCallback(async () => {
    setState((prev) => {
      const operation = prev.undoRedoStack.redo.pop();
      if (operation) {
        const newState = {
          ...prev,
          undoRedoStack: {
            ...prev.undoRedoStack,
            undo: [...prev.undoRedoStack.undo, operation].slice(-50),
          },
        };

        operation();
        return newState;
      }
      return prev;
    });
  }, []);

  const canUndo = state.undoRedoStack.undo.length > 0;
  const canRedo = state.undoRedoStack.redo.length > 0;

  // Wrapper functions for component callbacks
  const handleSpellSlotUpdate = useCallback(
    (character: CharacterResponseDto) => {
      const updates: Partial<UpdateCharacterDto> = {};
      if (character.spellcasting) {
        updates.spellcasting = character.spellcasting;
      }
      if (character.hitPoints) {
        updates.hitPoints = character.hitPoints;
      }
      handleUpdate(updates as UpdateCharacterDto);
    },
    [handleUpdate],
  );

  const handleSpellbookUpdate = useCallback(
    (character: CharacterResponseDto) => {
      const updates: Partial<UpdateCharacterDto> = {};
      if (character.spellcasting) {
        updates.spellcasting = character.spellcasting;
      }
      handleUpdate(updates as UpdateCharacterDto);
    },
    [handleUpdate],
  );

  const handleFeaturesUpdate = useCallback(
    (character: CharacterResponseDto) => {
      const updates: Partial<UpdateCharacterDto> = {
        featuresTraits: character.featuresTraits,
      };
      if (character.personalityTraits) {
        updates.personalityTraits = character.personalityTraits;
      }
      if (character.ideals) {
        updates.ideals = character.ideals;
      }
      if (character.bonds) {
        updates.bonds = character.bonds;
      }
      if (character.flaws) {
        updates.flaws = character.flaws;
      }
      handleUpdate(updates as UpdateCharacterDto);
    },
    [handleUpdate],
  );

  const toggleEditMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      editMode: !prev.editMode,
      hasUnsavedChanges: !prev.editMode,
    }));
  }, []);

  const toggleComparisonMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      comparisonMode: !prev.comparisonMode,
    }));
  }, []);

  const addToComparison = useCallback((charId: string) => {
    setState((prev) => ({
      ...prev,
      comparedCharacters: [
        ...prev.comparedCharacters.filter((id) => id !== charId),
        charId,
      ],
    }));
  }, []);

  const exportCharacter = useCallback(() => {
    if (!localCharacter) return;

    const exportData = {
      ...localCharacter,
      exportedAt: new Date().toISOString(),
      version: "2.0",
      exportType: "character-dashboard",
    };

    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${localCharacter.name || "character"}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [localCharacter]);

  const compareCharacters = useCallback(
    async (characterIds: string[]): Promise<Record<string, any>> => {
      const { characterApi } = await import("@/lib/api/character");
      const comparisons: Record<string, any> = {};

      for (const id of characterIds) {
        try {
          const character = await characterApi.getById(id);
          comparisons[id] = {
            name: character.name,
            level: character.level,
            race: character.race,
            multiclasses: character.multiclasses,
            hitPoints: character.hitPoints,
            abilityScores: character.abilityScores,
            armorClass: character.armorClass,
            proficiencyBonus: character.proficiencyBonus,
          };
        } catch (error) {
          comparisons[id] = {
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }

      return comparisons;
    },
    [],
  );

  const handleManualReconnect = () => {
    setSseDisabled(false);
    setIsPolling(false);
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setLastEventTimestamp(null);
    setAttemptHistory([]);
  };

  const stats = getEventStats();

  return (
    <div className="p-6 mx-auto space-y-6 max-w-7xl">
      <CharacterHeader
        character={localCharacter}
        proficiencyBonus={proficiencyBonus}
      />

      <DashboardHeader
        state={state}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onToggleEditMode={toggleEditMode}
        onToggleComparisonMode={toggleComparisonMode}
        onExport={exportCharacter}
        stats={stats}
        recentEvents={recentEvents}
      />

      <ConnectionStatusBanner
        sseDisabled={sseDisabled}
        isPolling={isPolling}
        onReconnect={handleManualReconnect}
      />

      <CharacterTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "overview" && (
        <OverviewTab
          character={localCharacter}
          proficiencyBonus={proficiencyBonus}
          onUpdate={(updates) => handleUpdate(updates as UpdateCharacterDto)}
        />
      )}

      {activeTab === "inventory" && (
        <div className="p-6 bg-white border rounded-lg">
          <h3 className="mb-4 text-lg font-semibold">Inventory Management</h3>
          <p className="text-gray-600">
            Inventory system with enhanced management coming soon...
          </p>

          {localCharacter.currency && (
            <div className="grid grid-cols-5 gap-4 mt-6">
              <div className="p-3 rounded bg-gray-50">
                <div className="font-bold">{localCharacter.currency.cp}</div>
                <div className="text-sm text-gray-600">CP</div>
              </div>
              <div className="p-3 rounded bg-gray-50">
                <div className="font-bold">{localCharacter.currency.sp}</div>
                <div className="text-sm text-gray-600">SP</div>
              </div>
              <div className="p-3 rounded bg-gray-50">
                <div className="font-bold">{localCharacter.currency.ep}</div>
                <div className="text-sm text-gray-600">EP</div>
              </div>
              <div className="p-3 rounded bg-gray-50">
                <div className="font-bold">{localCharacter.currency.gp}</div>
                <div className="text-sm text-gray-600">GP</div>
              </div>
              <div className="p-3 rounded bg-gray-50">
                <div className="font-bold">{localCharacter.currency.pp}</div>
                <div className="text-sm text-gray-600">PP</div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div className="p-6 bg-white border rounded-lg">
          <h3 className="mb-4 text-lg font-semibold">Character Notes</h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Personality Traits
                </label>
                <textarea
                  className="w-full px-3 py-2 border rounded"
                  rows={4}
                  value={localCharacter.personalityTraits || ""}
                  onChange={(e) =>
                    handleUpdate({
                      personalityTraits: e.target.value,
                    } as UpdateCharacterDto)
                  }
                  placeholder="Describe your character's personality traits..."
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Ideals</label>
                <textarea
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  value={localCharacter.ideals || ""}
                  onChange={(e) =>
                    handleUpdate({
                      ideals: e.target.value,
                    } as UpdateCharacterDto)
                  }
                  placeholder="What does your character believe in?"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium">Bonds</label>
                <textarea
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  value={localCharacter.bonds || ""}
                  onChange={(e) =>
                    handleUpdate({
                      bonds: e.target.value,
                    } as UpdateCharacterDto)
                  }
                  placeholder="What connections does your character have?"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Flaws</label>
                <textarea
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  value={localCharacter.flaws || ""}
                  onChange={(e) =>
                    handleUpdate({
                      flaws: e.target.value,
                    } as UpdateCharacterDto)
                  }
                  placeholder="What are your character's flaws?"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block mb-2 text-sm font-medium">Backstory</label>
            <textarea
              className="w-full px-3 py-2 border rounded"
              rows={8}
              value={localCharacter.backstory || ""}
              onChange={(e) =>
                handleUpdate({
                  backstory: e.target.value,
                } as UpdateCharacterDto)
              }
              placeholder="Tell your character's story..."
            />
          </div>
        </div>
      )}

      {activeTab === "comparison" && state.comparisonMode && (
        <div className="p-6 bg-white border rounded-lg">
          <h3 className="mb-4 text-lg font-semibold">Character Comparison</h3>
          <div className="p-4 rounded bg-purple-50">
            <p className="text-sm text-purple-800">
              Enter character IDs to compare (comma-separated):
            </p>
            <input
              className="w-full px-3 py-2 mt-2 border rounded"
              placeholder="Character IDs..."
              onChange={async (e) => {
                const ids = e.target.value
                  .split(",")
                  .map((id) => id.trim())
                  .filter(Boolean);

                if (ids.length > 0) {
                  const comparisons = await compareCharacters(ids);
                  console.log("Character comparisons:", comparisons);
                }
              }}
            />
            {state.comparedCharacters.length > 0 && (
              <div className="mt-2">
                <strong>Comparing with:</strong>{" "}
                {state.comparedCharacters.join(", ")}
              </div>
            )}
          </div>
        </div>
      )}

      <DiceRadialMenu characterId={localCharacter.id} />

      {activeTab === "spells" && (
        <div className="space-y-6">
          <SpellSlotTracker
            character={localCharacter}
            onCharacterUpdate={handleSpellSlotUpdate}
          />
          <Spellbook
            character={localCharacter}
            onCharacterUpdate={handleSpellbookUpdate}
          />
        </div>
      )}

      {activeTab === "features" && (
        <Features
          character={localCharacter}
          onCharacterUpdate={handleFeaturesUpdate}
        />
      )}

      {activeTab === "rolls" && <RollHistory characterId={localCharacter.id} />}
    </div>
  );
}
