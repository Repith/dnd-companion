"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CharacterBuilderData, CreateCharacterDto } from "@/types/character";
import {
  createCharacterSchema,
  CreateCharacterFormData,
} from "@/lib/validations/character";
import { characterApi } from "@/lib/api/character";
import { useRouter } from "next/navigation";
import CharacterBasicInfoStep from "./character-builder/CharacterBasicInfoStep";
import CharacterAbilityScoresStep from "./character-builder/CharacterAbilityScoresStep";
import CharacterSkillsStep from "./character-builder/CharacterSkillsStep";
import CharacterCombatStep from "./character-builder/CharacterCombatStep";
import CharacterBackgroundStep from "./character-builder/CharacterBackgroundStep";
import CharacterEquipmentStep from "./character-builder/CharacterEquipmentStep";

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
  const router = useRouter();

  const form = useForm<CreateCharacterFormData>({
    resolver: zodResolver(createCharacterSchema),
    defaultValues: {
      name: "",
      race: undefined,
      subrace: "",
      class: undefined,
      level: 1,
      background: "",
      alignment: undefined,
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
        skill: Object.values(require("@/types/character").SkillName)[i] as any,
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
      const character = await characterApi.create(data);
      if (onComplete) {
        onComplete(character);
      } else {
        router.push(`/characters/${character.id}`);
      }
    } catch (error) {
      console.error("Failed to create character:", error);
      // Handle error (show toast, etc.)
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
    <div className="max-w-4xl p-6 mx-auto">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Character Builder
        </h1>
        <p className="text-gray-600">
          Create your Dungeons & Dragons character step by step
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex items-center ${
                step.id < currentStep
                  ? "text-green-600"
                  : step.id === currentStep
                  ? "text-blue-600"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.id < currentStep
                    ? "bg-green-600 text-white"
                    : step.id === currentStep
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {step.id < currentStep ? "✓" : step.id}
              </div>
              <div className="hidden ml-3 sm:block">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="h-2 mt-4 bg-gray-200 rounded-full">
          <div
            className="h-2 transition-all duration-300 bg-blue-600 rounded-full"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="p-6 mb-6 bg-white border rounded-lg shadow-sm">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Character"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
