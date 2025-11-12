"use client";

import { UseFormReturn } from "react-hook-form";
import { CreateGeneratorRequestFormData } from "@/lib/validations/generator";
import { GeneratorType } from "@/types/generator";

interface GeneratorConfigStepProps {
  form: UseFormReturn<CreateGeneratorRequestFormData>;
}

export default function GeneratorConfigStep({
  form,
}: GeneratorConfigStepProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const selectedType = watch("type");
  const tags = watch("tags") || [];

  const handleTypeChange = (type: GeneratorType) => {
    setValue("type", type);
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setValue("tags", [...tags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue(
      "tags",
      tags.filter((tag) => tag !== tagToRemove),
    );
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const input = e.currentTarget;
      addTag(input.value.trim());
      input.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Generation Type
        </label>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <button
            type="button"
            onClick={() => handleTypeChange(GeneratorType.NPC)}
            className={`p-4 border rounded-lg text-left hover:bg-gray-50 transition-colors ${
              selectedType === GeneratorType.NPC
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <div className="font-medium text-gray-900">NPC</div>
            <div className="text-sm text-gray-500">
              Generate a non-player character
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange(GeneratorType.LOCATION)}
            className={`p-4 border rounded-lg text-left hover:bg-gray-50 transition-colors ${
              selectedType === GeneratorType.LOCATION
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <div className="font-medium text-gray-900">Location</div>
            <div className="text-sm text-gray-500">
              Generate a location or place
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange(GeneratorType.CAMPAIGN)}
            className={`p-4 border rounded-lg text-left hover:bg-gray-50 transition-colors ${
              selectedType === GeneratorType.CAMPAIGN
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <div className="font-medium text-gray-900">Quest</div>
            <div className="text-sm text-gray-500">
              Generate a quest or adventure
            </div>
          </button>
        </div>
        {errors.type && (
          <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
        )}
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Tags (Optional)
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="inline-flex items-center justify-center w-4 h-4 ml-1 text-blue-400 rounded-full hover:bg-blue-200 hover:text-blue-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Add tags and press Enter"
          onKeyPress={handleTagInputKeyPress}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Tags help guide the generation process (e.g., "evil", "forest",
          "mysterious")
        </p>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Prompt (Optional)
        </label>
        <textarea
          {...register("prompt")}
          rows={4}
          placeholder="Provide additional context or specific requirements for the generation..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Describe what you want to generate in more detail
        </p>
        {errors.prompt && (
          <p className="mt-1 text-sm text-red-600">{errors.prompt.message}</p>
        )}
      </div>
    </div>
  );
}
