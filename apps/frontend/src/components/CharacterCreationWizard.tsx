"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  CharacterResponseDto,
  CreateCharacterDto,
  Race,
  CharacterClass,
  Alignment,
} from "@/types/character";
import { characterApi } from "@/lib/api/character";
import { useCharacterEventBus } from "@/contexts/CharacterEventBus";
import { useCharacter } from "@/contexts/CharacterContext";

/**
 * Character Creation Wizard Steps
 */
export enum CharacterCreationStep {
  BASIC_INFO = 0,
  RACE_CLASS = 1,
  ABILITY_SCORES = 2,
  SKILLS = 3,
  REVIEW = 4,
}

/**
 * Character Creation Wizard Props
 */
interface CharacterCreationWizardProps {
  onCharacterCreated?: (character: CharacterResponseDto) => void;
  onCancel?: () => void;
  initialData?: Partial<CreateCharacterDto>;
  campaignId?: string;
}

/**
 * Character Creation Wizard State
 */
interface CharacterCreationState {
  currentStep: CharacterCreationStep;
  characterData: Partial<CreateCharacterDto>;
  validationErrors: Record<string, string[]>;
  isLoading: boolean;
  history: Partial<CreateCharacterDto>[];
  historyIndex: number;
}

/**
 * Enhanced Character Creation Wizard
 */
export function CharacterCreationWizard({
  onCharacterCreated,
  onCancel,
  initialData,
  campaignId,
}: CharacterCreationWizardProps) {
  const { createCharacter, validateCharacter, canUndo, canRedo, undo, redo } =
    useCharacterEventBus();
  const { setSelectedCharacter } = useCharacter();

  const [state, setState] = useState<CharacterCreationState>({
    currentStep: CharacterCreationStep.BASIC_INFO,
    characterData: {
      name: "",
      level: 1,
      experiencePoints: 0,
      inspiration: false,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      skillProficiencies: [],
      savingThrows: {
        strength: false,
        dexterity: false,
        constitution: false,
        intelligence: false,
        wisdom: false,
        charisma: false,
      },
      hitPoints: {
        max: 10,
        current: 10,
        temporary: 0,
      },
      armorClass: 10,
      initiative: 0,
      speed: 30,
      featuresTraits: [],
      languages: ["Common"],
      currency: {
        cp: 0,
        sp: 0,
        ep: 0,
        gp: 0,
        pp: 0,
      },
      campaignId: campaignId || undefined,
      ...initialData,
    },
    validationErrors: {},
    isLoading: false,
    history: [],
    historyIndex: -1,
  });

  /**
   * Step configurations
   */
  const steps = [
    {
      title: "Basic Information",
      description: "Character name and background",
    },
    { title: "Race & Class", description: "Choose race, class, and alignment" },
    { title: "Ability Scores", description: "Allocate ability points" },
    {
      title: "Skills & Proficiencies",
      description: "Select skills and save throws",
    },
    { title: "Review & Create", description: "Final review before creation" },
  ];

  /**
   * Update character data and add to history
   */
  const updateCharacterData = useCallback(
    (updates: Partial<CreateCharacterDto>) => {
      setState((prev) => {
        const newData = { ...prev.characterData, ...updates };

        // Add to history if significant change
        if (
          Object.keys(updates).some(
            (key) =>
              ![
                "validationErrors",
                "isLoading",
                "history",
                "historyIndex",
              ].includes(key),
          )
        ) {
          const newHistory = prev.history.slice(0, prev.historyIndex + 1);
          newHistory.push(prev.characterData);

          // Maintain max history size
          if (newHistory.length > 50) {
            newHistory.shift();
          }

          return {
            ...prev,
            characterData: newData,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        }

        return {
          ...prev,
          characterData: newData,
        };
      });
    },
    [],
  );

  /**
   * Validate current step
   */
  const validateCurrentStep = useCallback(() => {
    const errors: Record<string, string[]> = {};
    const { currentStep, characterData } = state;

    switch (currentStep) {
      case CharacterCreationStep.BASIC_INFO:
        if (!characterData.name?.trim()) {
          errors.name = ["Character name is required"];
        }
        if (
          !characterData.level ||
          characterData.level < 1 ||
          characterData.level > 20
        ) {
          errors.level = ["Level must be between 1 and 20"];
        }
        break;

      case CharacterCreationStep.RACE_CLASS:
        if (!characterData.race) {
          errors.race = ["Race is required"];
        }
        if (!characterData.class) {
          errors.class = ["Class is required"];
        }
        break;

      case CharacterCreationStep.ABILITY_SCORES:
        if (!characterData.abilityScores) {
          errors.abilityScores = ["Ability scores are required"];
        } else {
          const scores = characterData.abilityScores;
          const invalidScores = Object.entries(scores).filter(
            ([_, score]) =>
              typeof score === "number" &&
              (score < 3 || score > 20 || !Number.isInteger(score)),
          );
          if (invalidScores.length > 0) {
            errors.abilityScores = [
              "All ability scores must be integers between 3 and 20",
            ];
          }
        }
        break;

      case CharacterCreationStep.REVIEW:
        const validation = validateCharacter(characterData as any);
        if (!validation.valid) {
          errors.general = validation.errors;
        }
        break;
    }

    setState((prev) => ({ ...prev, validationErrors: errors }));
    return Object.keys(errors).length === 0;
  }, [state.currentStep, state.characterData, validateCharacter]);

  /**
   * Navigate to next step
   */
  const nextStep = useCallback(() => {
    if (validateCurrentStep()) {
      setState((prev) => ({
        ...prev,
        currentStep: Math.min(prev.currentStep + 1, steps.length - 1),
        validationErrors: {},
      }));
    }
  }, [validateCurrentStep, steps.length]);

  /**
   * Navigate to previous step
   */
  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
      validationErrors: {},
    }));
  }, []);

  /**
   * Create character
   */
  const handleCreateCharacter = useCallback(async () => {
    if (!validateCurrentStep()) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const character = await createCharacter(
        state.characterData as CreateCharacterDto,
      );
      setSelectedCharacter(character);
      onCharacterCreated?.(character);
    } catch (error) {
      console.error("Failed to create character:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        validationErrors: {
          general: [
            error instanceof Error
              ? error.message
              : "Failed to create character",
          ],
        },
      }));
    }
  }, [
    state.characterData,
    createCharacter,
    setSelectedCharacter,
    onCharacterCreated,
    validateCurrentStep,
  ]);

  /**
   * Export character data
   */
  const exportCharacter = useCallback(() => {
    const exportData = {
      ...state.characterData,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.characterData.name || "character"}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [state.characterData]);

  /**
   * Import character data
   */
  const importCharacter = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          updateCharacterData(importedData);
        } catch (error) {
          console.error("Failed to import character:", error);
          setState((prev) => ({
            ...prev,
            validationErrors: {
              general: ["Invalid character file format"],
            },
          }));
        }
      };
      reader.readAsText(file);
    },
    [updateCharacterData],
  );

  /**
   * Auto-save functionality
   */
  useEffect(() => {
    const autoSave = setTimeout(() => {
      if (
        state.characterData.name &&
        Object.keys(state.characterData).length > 1
      ) {
        localStorage.setItem(
          "character-creation-autosave",
          JSON.stringify(state.characterData),
        );
      }
    }, 2000);

    return () => clearTimeout(autoSave);
  }, [state.characterData]);

  /**
   * Load auto-saved data
   */
  useEffect(() => {
    const autoSaved = localStorage.getItem("character-creation-autosave");
    if (autoSaved && !initialData) {
      try {
        const savedData = JSON.parse(autoSaved);
        updateCharacterData(savedData);
      } catch (error) {
        console.error("Failed to load auto-saved data:", error);
      }
    }
  }, [initialData, updateCharacterData]);

  const progress = ((state.currentStep + 1) / steps.length) * 100;
  const isLastStep = state.currentStep === steps.length - 1;
  const canProceed = Object.keys(state.validationErrors).length === 0;

  return (
    <div className="max-w-4xl p-6 mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Character Creation</h1>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              onClick={undo}
              disabled={!canUndo}
            >
              Undo
            </button>
            <button
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              onClick={redo}
              disabled={!canRedo}
            >
              Redo
            </button>
            <button
              className="px-3 py-1 text-sm border rounded"
              onClick={exportCharacter}
            >
              Export
            </button>
            <label className="cursor-pointer">
              <button className="px-3 py-1 text-sm border rounded">
                Import
              </button>
              <input
                type="file"
                accept=".json"
                onChange={importCharacter}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 transition-all duration-300 bg-blue-600 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Step {state.currentStep + 1} of {steps.length}
          </span>
          <span>{steps[state.currentStep]?.title}</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6 space-y-6 bg-white border rounded-lg">
        <div>
          <h2 className="mb-2 text-xl font-semibold">
            {steps[state.currentStep]?.title}
          </h2>
          <p className="text-gray-600">
            {steps[state.currentStep]?.description}
          </p>
        </div>

        {/* Step Components */}
        <StepRenderer
          step={state.currentStep}
          characterData={state.characterData}
          onUpdate={updateCharacterData}
          validationErrors={state.validationErrors}
        />

        {/* Validation Errors */}
        {Object.keys(state.validationErrors).length > 0 && (
          <div className="p-4 border border-red-200 rounded bg-red-50">
            <h4 className="mb-2 font-medium text-red-800">Validation Errors</h4>
            {Object.entries(state.validationErrors).map(([field, errors]) => (
              <div key={field} className="text-sm text-red-700">
                <strong>{field}:</strong> {errors.join(", ")}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          className="px-4 py-2 border rounded disabled:opacity-50"
          onClick={prevStep}
          disabled={state.currentStep === 0}
        >
          Previous
        </button>

        <div className="flex gap-2">
          {onCancel && (
            <button className="px-4 py-2 border rounded" onClick={onCancel}>
              Cancel
            </button>
          )}

          {isLastStep ? (
            <button
              className="px-4 py-2 text-white bg-blue-600 rounded disabled:opacity-50"
              onClick={handleCreateCharacter}
              disabled={state.isLoading || !canProceed}
            >
              {state.isLoading ? "Creating..." : "Create Character"}
            </button>
          ) : (
            <button
              className="px-4 py-2 text-white bg-blue-600 rounded disabled:opacity-50"
              onClick={nextStep}
              disabled={!canProceed}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Step Renderer Component
 */
interface StepRendererProps {
  step: CharacterCreationStep;
  characterData: Partial<CreateCharacterDto>;
  onUpdate: (updates: Partial<CreateCharacterDto>) => void;
  validationErrors: Record<string, string[]>;
}

function StepRenderer({
  step,
  characterData,
  onUpdate,
  validationErrors,
}: StepRendererProps) {
  switch (step) {
    case CharacterCreationStep.BASIC_INFO:
      return (
        <BasicInfoStep
          characterData={characterData}
          onUpdate={onUpdate}
          validationErrors={validationErrors}
        />
      );
    case CharacterCreationStep.RACE_CLASS:
      return (
        <RaceClassStep
          characterData={characterData}
          onUpdate={onUpdate}
          validationErrors={validationErrors}
        />
      );
    case CharacterCreationStep.ABILITY_SCORES:
      return (
        <AbilityScoresStep
          characterData={characterData}
          onUpdate={onUpdate}
          validationErrors={validationErrors}
        />
      );
    case CharacterCreationStep.SKILLS:
      return (
        <SkillsStep
          characterData={characterData}
          onUpdate={onUpdate}
          validationErrors={validationErrors}
        />
      );
    case CharacterCreationStep.REVIEW:
      return (
        <ReviewStep
          characterData={characterData}
          onUpdate={onUpdate}
          validationErrors={validationErrors}
        />
      );
    default:
      return <div>Unknown step</div>;
  }
}

/**
 * Basic Information Step
 */
function BasicInfoStep({
  characterData,
  onUpdate,
  validationErrors,
}: StepRendererProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block mb-1 text-sm font-medium">
            Character Name *
          </label>
          <input
            id="name"
            className={`w-full px-3 py-2 border rounded ${
              validationErrors.name ? "border-red-500" : ""
            }`}
            value={characterData.name || ""}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
          {validationErrors.name && (
            <p className="mt-1 text-sm text-red-500">
              {validationErrors.name[0]}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="level" className="block mb-1 text-sm font-medium">
            Level *
          </label>
          <input
            id="level"
            type="number"
            min="1"
            max="20"
            className={`w-full px-3 py-2 border rounded ${
              validationErrors.level ? "border-red-500" : ""
            }`}
            value={characterData.level || 1}
            onChange={(e) => onUpdate({ level: parseInt(e.target.value) })}
          />
          {validationErrors.level && (
            <p className="mt-1 text-sm text-red-500">
              {validationErrors.level[0]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="background"
            className="block mb-1 text-sm font-medium"
          >
            Background
          </label>
          <input
            id="background"
            className="w-full px-3 py-2 border rounded"
            value={characterData.background || ""}
            onChange={(e) => onUpdate({ background: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="experience"
            className="block mb-1 text-sm font-medium"
          >
            Experience Points
          </label>
          <input
            id="experience"
            type="number"
            className="w-full px-3 py-2 border rounded"
            value={characterData.experiencePoints || 0}
            onChange={(e) =>
              onUpdate({ experiencePoints: parseInt(e.target.value) })
            }
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="inspiration"
            checked={characterData.inspiration || false}
            onChange={(e) => onUpdate({ inspiration: e.target.checked })}
          />
          <label htmlFor="inspiration">Heroic Inspiration</label>
        </div>
      </div>
    </div>
  );
}

/**
 * Race & Class Step
 */
function RaceClassStep({
  characterData,
  onUpdate,
  validationErrors,
}: StepRendererProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium">Race *</label>
          <select
            className={`w-full px-3 py-2 border rounded ${
              validationErrors.race ? "border-red-500" : ""
            }`}
            value={characterData.race || ""}
            onChange={(e) => onUpdate({ race: e.target.value as Race })}
          >
            <option value="">Select a race</option>
            {Object.values(Race).map((race) => (
              <option key={race} value={race}>
                {race.replace("_", " ")}
              </option>
            ))}
          </select>
          {validationErrors.race && (
            <p className="mt-1 text-sm text-red-500">
              {validationErrors.race[0]}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="subrace" className="block mb-1 text-sm font-medium">
            Subrace
          </label>
          <input
            id="subrace"
            className="w-full px-3 py-2 border rounded"
            value={characterData.subrace || ""}
            onChange={(e) => onUpdate({ subrace: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium">Class *</label>
          <select
            className={`w-full px-3 py-2 border rounded ${
              validationErrors.class ? "border-red-500" : ""
            }`}
            value={characterData.class || ""}
            onChange={(e) =>
              onUpdate({ class: e.target.value as CharacterClass })
            }
          >
            <option value="">Select a class</option>
            {Object.values(CharacterClass).map((characterClass) => (
              <option key={characterClass} value={characterClass}>
                {characterClass.replace("_", " ")}
              </option>
            ))}
          </select>
          {validationErrors.class && (
            <p className="mt-1 text-sm text-red-500">
              {validationErrors.class[0]}
            </p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Alignment</label>
          <select
            className="w-full px-3 py-2 border rounded"
            value={characterData.alignment || ""}
            onChange={(e) =>
              onUpdate({ alignment: e.target.value as Alignment })
            }
          >
            <option value="">Select alignment</option>
            {Object.values(Alignment).map((alignment) => (
              <option key={alignment} value={alignment}>
                {alignment.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

/**
 * Ability Scores Step
 */
function AbilityScoresStep({
  characterData,
  onUpdate,
  validationErrors,
}: StepRendererProps) {
  const abilities = [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
  ] as const;

  const updateAbilityScore = (ability: string, value: number) => {
    onUpdate({
      abilityScores: {
        ...characterData.abilityScores,
        [ability]: value,
      },
    });
  };

  const rollRandomScores = () => {
    const roll = () =>
      Math.floor(Math.random() * 6) +
      Math.floor(Math.random() * 6) +
      Math.floor(Math.random() * 6) +
      3;
    const newScores: any = {};
    abilities.forEach((ability) => {
      newScores[ability] = roll();
    });
    onUpdate({ abilityScores: newScores });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Allocate ability scores (3-20, higher is better)
        </p>
        <button
          className="px-3 py-1 text-sm border rounded"
          onClick={rollRandomScores}
        >
          Roll Random Scores
        </button>
      </div>

      {validationErrors.abilityScores && (
        <div className="p-4 border border-red-200 rounded bg-red-50">
          <p className="text-sm text-red-800">
            {validationErrors.abilityScores[0]}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {abilities.map((ability) => (
          <div key={ability} className="space-y-2">
            <label htmlFor={ability} className="block text-sm font-medium">
              {ability.charAt(0).toUpperCase() + ability.slice(1)}
            </label>
            <input
              id={ability}
              type="number"
              min="3"
              max="20"
              className="w-full px-3 py-2 border rounded"
              value={characterData.abilityScores?.[ability] || 10}
              onChange={(e) =>
                updateAbilityScore(ability, parseInt(e.target.value))
              }
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>
                Modifier:{" "}
                {Math.floor(
                  ((characterData.abilityScores?.[ability] || 10) - 10) / 2,
                )}
              </span>
              <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                {characterData.abilityScores?.[ability] >= 15
                  ? "High"
                  : characterData.abilityScores?.[ability] >= 13
                  ? "Good"
                  : characterData.abilityScores?.[ability] >= 8
                  ? "Average"
                  : "Low"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-lg bg-gray-50">
        <h4 className="mb-2 font-medium">Total Point Buy Cost</h4>
        <p className="text-sm text-gray-600">
          Point buy system: Each point above 8 costs progressively more.
          Standard array (15, 14, 13, 12, 10, 8) = 27 points.
        </p>
      </div>
    </div>
  );
}

/**
 * Skills Step (simplified for now)
 */
function SkillsStep({ characterData, onUpdate }: StepRendererProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Skills and proficiencies will be implemented in the next step.
      </p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {[
          "Acrobatics",
          "Animal Handling",
          "Arcana",
          "Athletics",
          "Deception",
          "History",
        ].map((skill) => (
          <div key={skill} className="flex items-center space-x-2">
            <input type="checkbox" id={skill} />
            <label htmlFor={skill} className="text-sm">
              {skill}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Review Step
 */
function ReviewStep({ characterData, onUpdate }: StepRendererProps) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg bg-gray-50">
        <h3 className="mb-4 font-medium">Character Summary</h3>
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <strong>Name:</strong> {characterData.name || "Not set"}
          </div>
          <div>
            <strong>Level:</strong> {characterData.level || 1}
          </div>
          <div>
            <strong>Race:</strong> {characterData.race || "Not selected"}
          </div>
          <div>
            <strong>Class:</strong> {characterData.class || "Not selected"}
          </div>
          <div>
            <strong>Background:</strong> {characterData.background || "Not set"}
          </div>
          <div>
            <strong>Alignment:</strong>{" "}
            {characterData.alignment?.replace("_", " ") || "Not selected"}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-gray-50">
        <h3 className="mb-4 font-medium">Ability Scores</h3>
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
          {characterData.abilityScores &&
            Object.entries(characterData.abilityScores).map(
              ([ability, score]) => (
                <div key={ability}>
                  <strong>
                    {ability.charAt(0).toUpperCase() + ability.slice(1)}:
                  </strong>{" "}
                  {score as number}
                </div>
              ),
            )}
        </div>
      </div>

      <div className="p-4 rounded-lg bg-gray-50">
        <h3 className="mb-4 font-medium">Hit Points</h3>
        <div className="space-y-1 text-sm">
          <div>
            <strong>Max HP:</strong> {characterData.hitPoints?.max || 10}
          </div>
          <div>
            <strong>Current HP:</strong>{" "}
            {characterData.hitPoints?.current || 10}
          </div>
          <div>
            <strong>Temporary HP:</strong>{" "}
            {characterData.hitPoints?.temporary || 0}
          </div>
        </div>
      </div>

      <div className="p-4 border border-blue-200 rounded bg-blue-50">
        <p className="text-sm text-blue-800">
          Please review your character details carefully. Once created, some
          details cannot be changed easily.
        </p>
      </div>
    </div>
  );
}

export default CharacterCreationWizard;
