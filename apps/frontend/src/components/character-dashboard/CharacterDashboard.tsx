// CharacterDashboard.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { CharacterResponseDto, UpdateCharacterDto } from "@/types/character";
import { calculateProficiencyBonus } from "./utils";
import { CharacterHeader } from "./CharacterHeader";
import { CharacterTabs } from "./CharacterTabs";
import { OverviewCard } from "./tabs/OverviewCard";

import {
  useCharacterEventBus,
  useCharacterEvents,
  type CharacterEvent,
} from "@/contexts/CharacterEventBus";
import { useCharacter } from "@/contexts/CharacterContext";
import { DashboardHeader } from "./DashboardHeader";
import { ConnectionStatusBanner } from "./ConnectionStatusBanner";
import { DiceRadialMenu } from "../dice-rolls/DiceRadialMenu";

import { useCharacterRealtimeEvents } from "./useCharacterRealtimeEvents";
import { useCharacterValidation } from "./useCharacterValidation";
import { applyCharacterEvent } from "./characterEventReducer";
import {
  CharacterDashboardState,
  CharacterTab,
} from "./CharacterDashboard.types";
import { InventoryTab } from "./tabs/InventoryTab";
import { NotesTab } from "./tabs/NotesTab";
import { ComparisonTab } from "./tabs/ComparisonTab";
import { SpellsTab } from "./tabs/SpellsTab";
import { FeaturesTab } from "./tabs/FeaturesTab";
import { RollsTab } from "./tabs/RollsTab";

export interface CharacterDashboardProps {
  character: CharacterResponseDto;
  onUpdate?: (updates: Partial<CharacterResponseDto>) => void;
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

  // sync z parentem / zmianą wybranej postaci
  useEffect(() => {
    setLocalCharacter(character);
    setState((prev) => ({
      ...prev,
      lastSavedData: character,
      hasUnsavedChanges: false,
      characterStats: {
        ...prev.characterStats,
        version: prev.characterStats.version + 1,
      },
    }));
    setSelectedCharacter(character);
  }, [character, setSelectedCharacter]);

  // walidacja w osobnym hooku
  useCharacterValidation(localCharacter, state.editMode, setState);

  // SSE + polling
  const { sseDisabled, isPolling, handleManualReconnect } =
    useCharacterRealtimeEvents({
      characterId: localCharacter.id,
      publishEvent,
    });

  // obsługa eventów z event busa
  const handleEvent = useCallback((event: CharacterEvent) => {
    setLocalCharacter((prev) => {
      const { nextCharacter, didUpdate, message } = applyCharacterEvent(
        prev,
        event,
      );

      if (didUpdate) {
        setState((prevState) => ({
          ...prevState,
          characterStats: {
            ...prevState.characterStats,
            totalUpdates: prevState.characterStats.totalUpdates + 1,
            lastModified: new Date(),
          },
        }));

        if (message) {
          setRecentEvents((prevEvents) =>
            [message, ...prevEvents].slice(0, 10),
          );
        }
      }

      return nextCharacter;
    });
  }, []);

  useCharacterEvents(handleEvent, { characterId: localCharacter.id });

  const proficiencyBonus = calculateProficiencyBonus(localCharacter.level);

  /**
   * Update + undo/redo
   */
  const handleUpdate = useCallback(
    async (updates: UpdateCharacterDto) => {
      const characterId = localCharacter.id;
      const previousState = localCharacter;

      try {
        const updatedCharacter = await updateCharacter(characterId, updates);

        setLocalCharacter(updatedCharacter);

        setState((prev) => ({
          ...prev,
          undoRedoStack: {
            undo: [
              ...prev.undoRedoStack.undo,
              async () => {
                await updateCharacter(
                  characterId,
                  previousState as unknown as UpdateCharacterDto,
                );
                setLocalCharacter(previousState);
              },
            ].slice(-50),
            redo: [],
          },
          hasUnsavedChanges: false,
          lastSavedData: updatedCharacter,
        }));

        onUpdate?.(updatedCharacter);
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

  const undo = useCallback(() => {
    setState((prev) => {
      const undoStack = [...prev.undoRedoStack.undo];
      const operation = undoStack.pop();
      if (!operation) return prev;

      const redoStack = [...prev.undoRedoStack.redo, operation].slice(-50);
      Promise.resolve(operation()).catch((err) =>
        console.error("Undo operation failed:", err),
      );

      return {
        ...prev,
        undoRedoStack: { undo: undoStack, redo: redoStack },
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      const redoStack = [...prev.undoRedoStack.redo];
      const operation = redoStack.pop();
      if (!operation) return prev;

      const undoStack = [...prev.undoRedoStack.undo, operation].slice(-50);
      Promise.resolve(operation()).catch((err) =>
        console.error("Redo operation failed:", err),
      );

      return {
        ...prev,
        undoRedoStack: { undo: undoStack, redo: redoStack },
      };
    });
  }, []);

  const canUndo = state.undoRedoStack.undo.length > 0;
  const canRedo = state.undoRedoStack.redo.length > 0;

  // thin wrappers pod konkretne update'y
  const handleSpellSlotUpdate = useCallback(
    (updated: CharacterResponseDto) => {
      const updates: Partial<UpdateCharacterDto> = {};
      if (updated.spellcasting) updates.spellcasting = updated.spellcasting;
      if (updated.hitPoints) updates.hitPoints = updated.hitPoints;
      handleUpdate(updates as UpdateCharacterDto);
    },
    [handleUpdate],
  );

  const handleSpellbookUpdate = useCallback(
    (updated: CharacterResponseDto) => {
      const updates: Partial<UpdateCharacterDto> = {};
      if (updated.spellcasting) updates.spellcasting = updated.spellcasting;
      handleUpdate(updates as UpdateCharacterDto);
    },
    [handleUpdate],
  );

  const handleFeaturesUpdate = useCallback(
    (updated: CharacterResponseDto) => {
      const updates: Partial<UpdateCharacterDto> = {
        featuresTraits: updated.featuresTraits ?? [],
        personalityTraits: updated.personalityTraits ?? "",
        ideals: updated.ideals ?? "",
        bonds: updated.bonds ?? "",
        flaws: updated.flaws ?? "",
      };
      handleUpdate(updates as UpdateCharacterDto);
    },
    [handleUpdate],
  );

  const toggleEditMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      editMode: !prev.editMode,
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
      comparedCharacters: prev.comparedCharacters.includes(charId)
        ? prev.comparedCharacters.filter((id) => id !== charId)
        : [...prev.comparedCharacters, charId],
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
        <OverviewCard
          character={localCharacter}
          proficiencyBonus={proficiencyBonus}
          onUpdate={(updates) => handleUpdate(updates as UpdateCharacterDto)}
        />
      )}

      {activeTab === "inventory" && <InventoryTab character={localCharacter} />}

      {activeTab === "notes" && (
        <NotesTab
          character={localCharacter}
          onChange={(updates) => handleUpdate(updates)}
        />
      )}

      {activeTab === "comparison" && state.comparisonMode && (
        <ComparisonTab
          comparedCharacters={state.comparedCharacters}
          onAddToComparison={addToComparison}
          onCompare={compareCharacters}
        />
      )}

      <DiceRadialMenu characterId={localCharacter.id} />

      {activeTab === "spells" && (
        <SpellsTab
          character={localCharacter}
          onSpellSlotUpdate={handleSpellSlotUpdate}
          onSpellbookUpdate={handleSpellbookUpdate}
        />
      )}

      {activeTab === "features" && (
        <FeaturesTab
          character={localCharacter}
          onFeaturesUpdate={handleFeaturesUpdate}
        />
      )}

      {activeTab === "rolls" && <RollsTab characterId={localCharacter.id} />}
    </div>
  );
}
