"use client";

import { UseFormReturn } from "react-hook-form";
import { CreateCharacterFormData } from "@/lib/validations/character";

interface CharacterBackgroundStepProps {
  form: UseFormReturn<CreateCharacterFormData>;
}

export default function CharacterBackgroundStep({
  form,
}: CharacterBackgroundStepProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const languages = watch("languages") || [];

  const addLanguage = () => {
    const newLanguages = [...languages, ""];
    setValue("languages", newLanguages);
  };

  const removeLanguage = (index: number) => {
    const newLanguages = languages.filter((_, i) => i !== index);
    setValue("languages", newLanguages);
  };

  const updateLanguage = (index: number, value: string) => {
    const newLanguages = [...languages];
    newLanguages[index] = value;
    setValue("languages", newLanguages);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Background & Personality
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Define your character's personality, backstory, and background
          details.
        </p>
      </div>

      {/* Personality Traits */}
      <div>
        <label
          htmlFor="personalityTraits"
          className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Personality Traits
        </label>
        <textarea
          {...register("personalityTraits")}
          id="personalityTraits"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          placeholder="Describe your character's personality traits..."
        />
      </div>

      {/* Ideals */}
      <div>
        <label
          htmlFor="ideals"
          className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Ideals
        </label>
        <textarea
          {...register("ideals")}
          id="ideals"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          placeholder="What does your character believe in..."
        />
      </div>

      {/* Bonds */}
      <div>
        <label
          htmlFor="bonds"
          className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Bonds
        </label>
        <textarea
          {...register("bonds")}
          id="bonds"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          placeholder="What ties does your character have..."
        />
      </div>

      {/* Flaws */}
      <div>
        <label
          htmlFor="flaws"
          className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Flaws
        </label>
        <textarea
          {...register("flaws")}
          id="flaws"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          placeholder="What weaknesses does your character have..."
        />
      </div>

      {/* Backstory */}
      <div>
        <label
          htmlFor="backstory"
          className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Backstory
        </label>
        <textarea
          {...register("backstory")}
          id="backstory"
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          placeholder="Tell your character's story..."
        />
      </div>

      {/* Languages */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Languages *
          </label>
          <button
            type="button"
            onClick={addLanguage}
            className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            Add Language
          </button>
        </div>

        <div className="space-y-2">
          {languages.map((language, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={language}
                onChange={(e) => updateLanguage(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder="Language name"
              />
              <button
                type="button"
                onClick={() => removeLanguage(index)}
                className="px-3 py-2 text-red-600 hover:text-red-800"
                disabled={languages.length <= 1}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {errors.languages && (
          <p className="mt-1 text-sm text-red-600">
            {errors.languages.message}
          </p>
        )}
      </div>

      {/* Appearance */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="age"
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Age
          </label>
          <input
            {...register("appearance.age", { valueAsNumber: true })}
            type="number"
            id="age"
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
        </div>

        <div>
          <label
            htmlFor="height"
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Height
          </label>
          <input
            {...register("appearance.height")}
            type="text"
            id="height"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder="e.g., 5'10"
          />
        </div>

        <div>
          <label
            htmlFor="weight"
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Weight (lbs)
          </label>
          <input
            {...register("appearance.weight", { valueAsNumber: true })}
            type="number"
            id="weight"
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
        </div>

        <div>
          <label
            htmlFor="eyes"
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Eyes
          </label>
          <input
            {...register("appearance.eyes")}
            type="text"
            id="eyes"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder="e.g., Blue"
          />
        </div>

        <div>
          <label
            htmlFor="skin"
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Skin
          </label>
          <input
            {...register("appearance.skin")}
            type="text"
            id="skin"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder="e.g., Fair"
          />
        </div>

        <div>
          <label
            htmlFor="hair"
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Hair
          </label>
          <input
            {...register("appearance.hair")}
            type="text"
            id="hair"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            placeholder="e.g., Brown"
          />
        </div>
      </div>
    </div>
  );
}
