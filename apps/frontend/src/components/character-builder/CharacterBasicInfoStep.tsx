"use client";

import { UseFormReturn } from "react-hook-form";
import { CreateCharacterFormData } from "@/lib/validations/character";
import { Race, CharacterClass, Alignment } from "@/types/character";

interface CharacterBasicInfoStepProps {
  form: UseFormReturn<CreateCharacterFormData>;
}

const RACE_OPTIONS = Object.values(Race);
const CLASS_OPTIONS = Object.values(CharacterClass);
const ALIGNMENT_OPTIONS = Object.values(Alignment);

export default function CharacterBasicInfoStep({
  form,
}: CharacterBasicInfoStepProps) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = form;

  const selectedRace = watch("race");
  const selectedClass = watch("class");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Basic Information
        </h2>
        <p className="mb-6 text-gray-600">
          Start by giving your character a name and choosing their fundamental
          traits.
        </p>
      </div>

      {/* Character Name */}
      <div>
        <label
          htmlFor="name"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Character Name *
        </label>
        <input
          {...register("name")}
          type="text"
          id="name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter character name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Race Selection */}
      <div>
        <label
          htmlFor="race"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Race *
        </label>
        <select
          {...register("race")}
          id="race"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a race</option>
          {RACE_OPTIONS.map((race) => (
            <option key={race} value={race}>
              {race
                .replace("_", " ")
                .toLowerCase()
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </option>
          ))}
        </select>
        {errors.race && (
          <p className="mt-1 text-sm text-red-600">{errors.race.message}</p>
        )}
      </div>

      {/* Subrace (conditional) */}
      {selectedRace && (
        <div>
          <label
            htmlFor="subrace"
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            Subrace
          </label>
          <input
            {...register("subrace")}
            type="text"
            id="subrace"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., High Elf, Wood Elf"
          />
        </div>
      )}

      {/* Class Selection */}
      <div>
        <label
          htmlFor="class"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Class *
        </label>
        <select
          {...register("class")}
          id="class"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a class</option>
          {CLASS_OPTIONS.map((characterClass) => (
            <option key={characterClass} value={characterClass}>
              {characterClass
                .replace("_", " ")
                .toLowerCase()
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </option>
          ))}
        </select>
        {errors.class && (
          <p className="mt-1 text-sm text-red-600">{errors.class.message}</p>
        )}
      </div>

      {/* Level */}
      <div>
        <label
          htmlFor="level"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Level *
        </label>
        <input
          {...register("level", { valueAsNumber: true })}
          type="number"
          id="level"
          min="1"
          max="20"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.level && (
          <p className="mt-1 text-sm text-red-600">{errors.level.message}</p>
        )}
      </div>

      {/* Background */}
      <div>
        <label
          htmlFor="background"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Background
        </label>
        <input
          {...register("background")}
          type="text"
          id="background"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Noble, Criminal, Entertainer"
        />
      </div>

      {/* Alignment */}
      <div>
        <label
          htmlFor="alignment"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Alignment
        </label>
        <select
          {...register("alignment")}
          id="alignment"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select alignment</option>
          {ALIGNMENT_OPTIONS.map((alignment) => (
            <option key={alignment} value={alignment}>
              {alignment
                .replace("_", " ")
                .toLowerCase()
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
