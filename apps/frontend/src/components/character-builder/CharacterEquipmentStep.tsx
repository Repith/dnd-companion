"use client";

import { UseFormReturn } from "react-hook-form";
import { CreateCharacterFormData } from "@/lib/validations/character";

interface CharacterEquipmentStepProps {
  form: UseFormReturn<CreateCharacterFormData>;
}

export default function CharacterEquipmentStep({
  form,
}: CharacterEquipmentStepProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const currency = watch("currency");
  const featuresTraits = watch("featuresTraits") || [];

  const addFeatureTrait = () => {
    const newFeatures = [...featuresTraits, ""];
    setValue("featuresTraits", newFeatures);
  };

  const removeFeatureTrait = (index: number) => {
    const newFeatures = featuresTraits.filter((_, i) => i !== index);
    setValue("featuresTraits", newFeatures);
  };

  const updateFeatureTrait = (index: number, value: string) => {
    const newFeatures = [...featuresTraits];
    newFeatures[index] = value;
    setValue("featuresTraits", newFeatures);
  };

  const totalCurrency = Object.values(currency).reduce(
    (sum, amount) => sum + amount,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Equipment & Features
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Set your starting currency and list your character's features and
          traits.
        </p>
      </div>

      {/* Currency */}
      <div className="p-6 rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
          Starting Currency
        </h3>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div>
            <label
              htmlFor="cp"
              className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Copper (cp)
            </label>
            <input
              {...register("currency.cp", { valueAsNumber: true })}
              type="number"
              id="cp"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <div>
            <label
              htmlFor="sp"
              className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Silver (sp)
            </label>
            <input
              {...register("currency.sp", { valueAsNumber: true })}
              type="number"
              id="sp"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <div>
            <label
              htmlFor="ep"
              className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Electrum (ep)
            </label>
            <input
              {...register("currency.ep", { valueAsNumber: true })}
              type="number"
              id="ep"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <div>
            <label
              htmlFor="gp"
              className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Gold (gp)
            </label>
            <input
              {...register("currency.gp", { valueAsNumber: true })}
              type="number"
              id="gp"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <div>
            <label
              htmlFor="pp"
              className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Platinum (pp)
            </label>
            <input
              {...register("currency.pp", { valueAsNumber: true })}
              type="number"
              id="pp"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>
        </div>

        <div className="p-3 mt-4 rounded-md bg-blue-50 dark:bg-blue-900">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Total Value:</strong> {totalCurrency} gp
            {currency.gp > 0 &&
              ` (${currency.gp}g ${currency.sp}s ${currency.cp}c)`}
          </p>
        </div>
      </div>

      {/* Features & Traits */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Features & Traits *
          </h3>
          <button
            type="button"
            onClick={addFeatureTrait}
            className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            Add Feature
          </button>
        </div>

        <div className="space-y-3">
          {featuresTraits.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={feature}
                onChange={(e) => updateFeatureTrait(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder="e.g., Darkvision, Spellcasting, Lucky"
              />
              <button
                type="button"
                onClick={() => removeFeatureTrait(index)}
                className="px-3 py-2 text-red-600 hover:text-red-800"
                disabled={featuresTraits.length <= 1}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {errors.featuresTraits && (
          <p className="mt-1 text-sm text-red-600">
            {errors.featuresTraits.message}
          </p>
        )}
      </div>

      {/* Experience Points */}
      <div>
        <label
          htmlFor="experiencePoints"
          className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Experience Points
        </label>
        <input
          {...register("experiencePoints", { valueAsNumber: true })}
          type="number"
          id="experiencePoints"
          min="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
      </div>

      {/* Inspiration */}
      <div className="flex items-center space-x-3">
        <input
          {...register("inspiration")}
          type="checkbox"
          id="inspiration"
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label
          htmlFor="inspiration"
          className="text-sm font-medium text-gray-700"
        >
          Character has inspiration
        </label>
      </div>

      {/* Summary */}
      <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900">
        <h3 className="mb-2 font-medium text-green-900 dark:text-green-100">
          Character Summary
        </h3>
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <span className="text-green-700 dark:text-green-300">
              Features/Traits:
            </span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {featuresTraits.length}
            </span>
          </div>
          <div>
            <span className="text-green-700 dark:text-green-300">
              Experience Points:
            </span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {watch("experiencePoints") || 0}
            </span>
          </div>
          <div>
            <span className="text-green-700 dark:text-green-300">
              Inspiration:
            </span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {watch("inspiration") ? "Yes" : "No"}
            </span>
          </div>
          <div>
            <span className="text-green-700 dark:text-green-300">
              Total Currency:
            </span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {totalCurrency} gp
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
