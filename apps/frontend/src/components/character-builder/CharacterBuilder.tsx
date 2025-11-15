"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CharacterBuilderData,
  CreateCharacterDto,
  SkillName,
  Race,
  CharacterClass,
  Alignment,
} from "@/types/character";
import {
  createCharacterSchema,
  CreateCharacterFormData,
} from "@/lib/validations/character";
import { characterApi } from "@/lib/api/character";
import { useRouter } from "next/navigation";
import CharacterBasicInfoStep from "./CharacterBasicInfoStep";
import CharacterAbilityScoresStep from "./CharacterAbilityScoresStep";
import CharacterSkillsStep from "./CharacterSkillsStep";
import CharacterCombatStep from "./CharacterCombatStep";
import CharacterBackgroundStep from "./CharacterBackgroundStep";
import CharacterEquipmentStep from "./CharacterEquipmentStep";

const STEPS = [
  { id: 1, title: "Basic Info", description: "Race, Class, Background" },
  { id: 2, title: "Ability Scores", description: "Strength, Dexterity, etc." },
  { id: 3, title: "Skills & Proficiencies", description: "Choose your skills" },
  { id: 4, title: "Combat Stats", description: "HP, AC, Initiative" },
  {
    id: 5,
    title: "Background & Personality",
    description: "Backstory, traits",
  },
  { id: 6, title: "Equipment & Currency", description: "Starting gear" },
];

interface CharacterBuilderProps {
  onComplete?: (character: any) => void;
}

export default function CharacterBuilder({
  onComplete,
}: CharacterBuilderProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalErrors, setGlobalErrors] = useState<string[]>([]);
  const router = useRouter();

  const form = useForm<CreateCharacterFormData>({
    resolver: zodResolver(createCharacterSchema),
    defaultValues: {
      name: "",
      race: Race.HUMAN,
      subrace: "",
      class: CharacterClass.FIGHTER,
      level: 1,
      background: "",
      alignment: Alignment.TRUE_NEUTRAL,
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
      skillProficiencies: Array.from({ length: 18 }, (_, i) => ({
        skill: Object.values(SkillName)[i] as SkillName,
        proficient: false,
        expertise: false,
      })),
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
      personalityTraits: "",
      ideals: "",
      bonds: "",
      flaws: "",
      backstory: "",
      languages: ["Common"],
      currency: {
        cp: 0,
        sp: 0,
        ep: 0,
        gp: 10,
        pp: 0,
      },
    },
  });

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: CreateCharacterFormData) => {
    try {
      setIsSubmitting(true);
      setGlobalErrors([]);

      // Transform data to match backend expectations
      const transformedData = {
        ...data,
        subrace: data.subrace || undefined,
        background: data.background || undefined,
        alignment: data.alignment || undefined,
        personalityTraits: data.personalityTraits || undefined,
        ideals: data.ideals || undefined,
        bonds: data.bonds || undefined,
        flaws: data.flaws || undefined,
        backstory: data.backstory || undefined,
        appearance: data.appearance || undefined,
      } as CreateCharacterDto;

      const character = await characterApi.create(transformedData);

      if (onComplete) {
        onComplete(character);
      } else {
        router.push(`/dashboard/characters/${character.id}`);
      }
    } catch (error: any) {
      console.error("Failed to create character:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create character";
      setGlobalErrors([errorMessage]);
      alert(`Error: ${errorMessage}`); // Temporary alert until toast is installed
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CharacterBasicInfoStep form={form} />;
      case 2:
        return <CharacterAbilityScoresStep form={form} />;
      case 3:
        return <CharacterSkillsStep form={form} />;
      case 4:
        return <CharacterCombatStep form={form} />;
      case 5:
        return <CharacterBackgroundStep form={form} />;
      case 6:
        return <CharacterEquipmentStep form={form} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl p-6 mx-auto transition-all duration-300 bg-stone-100 dark:bg-stone-950">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold transition-all duration-300 text-stone-900 dark:text-stone-100">
          Character Builder
        </h1>
        <p className="transition-all duration-300 text-stone-700 dark:text-stone-200">
          Create your Dungeons & Dragons character step by step
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex items-center transition-all duration-300 ${
                step.id < currentStep
                  ? "text-green-600 dark:text-green-400"
                  : step.id === currentStep
                  ? "text-stone-900 dark:text-stone-100"
                  : "text-stone-400 dark:text-stone-500"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  step.id < currentStep
                    ? "bg-green-600 dark:bg-green-500 text-white"
                    : step.id === currentStep
                    ? "bg-stone-900 dark:bg-stone-200 text-stone-100 dark:text-stone-900"
                    : "bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300"
                }`}
              >
                {step.id < currentStep ? "✓" : step.id}
              </div>
              <div className="hidden ml-3 sm:block">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs transition-all duration-300 text-stone-500 dark:text-stone-400">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="h-2 mt-4 transition-all duration-300 rounded-full bg-stone-200 dark:bg-stone-700">
          <div
            className="h-2 transition-all duration-300 rounded-full bg-stone-900 dark:bg-stone-200"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Global Error Display */}
      {globalErrors.length > 0 && (
        <div className="p-4 mb-6 transition-all duration-300 border border-red-200 rounded-lg dark:border-red-800 bg-red-50 dark:bg-red-950">
          <h3 className="mb-2 text-sm font-medium text-red-800 transition-all duration-300 dark:text-red-200">
            Please fix the following errors:
          </h3>
          <ul className="text-sm text-red-700 list-disc list-inside transition-all duration-300 dark:text-red-300">
            {globalErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Step Content */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="p-6 mb-6 transition-all duration-300 border rounded-lg shadow-sm border-stone-300 dark:border-stone-600 bg-stone-200 dark:bg-stone-900">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 text-sm font-medium transition-all duration-300 border rounded-md text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-900 border-stone-300 dark:border-stone-600 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-4 py-2 text-sm font-medium transition-all duration-300 border border-transparent rounded-md text-stone-100 dark:text-stone-900 bg-stone-900 dark:bg-stone-200 hover:bg-stone-900 dark:hover:bg-stone-100"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white transition-all duration-300 bg-green-600 border border-transparent rounded-md dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Character"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
