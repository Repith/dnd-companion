"use client";

import React, { useState } from "react";
import { CharacterResponseDto } from "@/types/character";
import { characterApi } from "@/lib/api/character";

interface FeaturesProps {
  character: CharacterResponseDto;
  onCharacterUpdate: (character: CharacterResponseDto) => void;
}

export const Features: React.FC<FeaturesProps> = ({
  character,
  onCharacterUpdate,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const handleEditStart = (field: string, currentValue: string = "") => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const handleEditCancel = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleEditSave = async (field: keyof CharacterResponseDto) => {
    if (!editValue.trim()) return;

    setSaving(true);
    try {
      const updateData = { [field]: editValue };
      const updatedCharacter = await characterApi.update(
        character.id,
        updateData,
      );
      onCharacterUpdate(updatedCharacter);
      setEditingField(null);
      setEditValue("");
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddFeature = async () => {
    if (!editValue.trim()) return;

    setSaving(true);
    try {
      const currentFeatures = character.featuresTraits || [];
      const updateData = {
        featuresTraits: [...currentFeatures, editValue],
      };
      const updatedCharacter = await characterApi.update(
        character.id,
        updateData,
      );
      onCharacterUpdate(updatedCharacter);
      setEditingField(null);
      setEditValue("");
    } catch (error) {
      console.error("Failed to add feature:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFeature = async (index: number) => {
    try {
      const currentFeatures = character.featuresTraits || [];
      const updateData = {
        featuresTraits: currentFeatures.filter((_, i) => i !== index),
      };
      const updatedCharacter = await characterApi.update(
        character.id,
        updateData,
      );
      onCharacterUpdate(updatedCharacter);
    } catch (error) {
      console.error("Failed to remove feature:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Features & Traits */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Features & Traits
          </h3>
          <button
            onClick={() => handleEditStart("add-feature")}
            className="px-3 py-1 text-sm text-white transition-colors bg-blue-600 rounded hover:bg-blue-700"
          >
            Add Feature
          </button>
        </div>

        {editingField === "add-feature" && (
          <div className="p-4 mb-4 rounded-lg bg-gray-50 dark:bg-gray-700">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Enter feature or trait description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm resize-none dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              rows={3}
            />
            <div className="flex justify-end mt-2 space-x-2">
              <button
                onClick={handleEditCancel}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFeature}
                disabled={saving || !editValue.trim()}
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {character.featuresTraits && character.featuresTraits.length > 0 ? (
            character.featuresTraits.map((feature, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
              >
                <p className="flex-1 text-gray-700 dark:text-gray-300">
                  {feature}
                </p>
                <button
                  onClick={() => handleRemoveFeature(index)}
                  className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  aria-label={`Remove feature: ${feature}`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))
          ) : (
            <p className="italic text-gray-500 dark:text-gray-400">
              No features or traits added yet.
            </p>
          )}
        </div>
      </div>

      {/* Personality Traits */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Personality Traits
          </h3>
          {editingField !== "personalityTraits" && (
            <button
              onClick={() =>
                handleEditStart(
                  "personalityTraits",
                  character.personalityTraits || "",
                )
              }
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Edit
            </button>
          )}
        </div>

        {editingField === "personalityTraits" ? (
          <div className="space-y-3">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Describe your character's personality traits..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm resize-none dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleEditCancel}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEditSave("personalityTraits")}
                disabled={saving}
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 dark:text-gray-300">
            {character.personalityTraits || "No personality traits described."}
          </p>
        )}
      </div>

      {/* Ideals */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Ideals
          </h3>
          {editingField !== "ideals" && (
            <button
              onClick={() => handleEditStart("ideals", character.ideals || "")}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Edit
            </button>
          )}
        </div>

        {editingField === "ideals" ? (
          <div className="space-y-3">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Describe your character's ideals..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm resize-none dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleEditCancel}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEditSave("ideals")}
                disabled={saving}
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 dark:text-gray-300">
            {character.ideals || "No ideals described."}
          </p>
        )}
      </div>

      {/* Bonds */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Bonds
          </h3>
          {editingField !== "bonds" && (
            <button
              onClick={() => handleEditStart("bonds", character.bonds || "")}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Edit
            </button>
          )}
        </div>

        {editingField === "bonds" ? (
          <div className="space-y-3">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Describe your character's bonds..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm resize-none dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleEditCancel}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEditSave("bonds")}
                disabled={saving}
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 dark:text-gray-300">
            {character.bonds || "No bonds described."}
          </p>
        )}
      </div>

      {/* Flaws */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Flaws
          </h3>
          {editingField !== "flaws" && (
            <button
              onClick={() => handleEditStart("flaws", character.flaws || "")}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Edit
            </button>
          )}
        </div>

        {editingField === "flaws" ? (
          <div className="space-y-3">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Describe your character's flaws..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm resize-none dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleEditCancel}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEditSave("flaws")}
                disabled={saving}
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 dark:text-gray-300">
            {character.flaws || "No flaws described."}
          </p>
        )}
      </div>

      {/* Backstory */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Backstory
          </h3>
          {editingField !== "backstory" && (
            <button
              onClick={() =>
                handleEditStart("backstory", character.backstory || "")
              }
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Edit
            </button>
          )}
        </div>

        {editingField === "backstory" ? (
          <div className="space-y-3">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Write your character's backstory..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm resize-none dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows={8}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleEditCancel}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEditSave("backstory")}
                disabled={saving}
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap dark:text-gray-300">
            {character.backstory || "No backstory written yet."}
          </p>
        )}
      </div>
    </div>
  );
};
