"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CharacterResponseDto } from "@/types/character";
import { characterApi } from "@/lib/api/character";
import { ApiError } from "@/lib/api/error-handler";

interface CharacterListProps {
  onCharacterSelect?: (character: CharacterResponseDto) => void;
  onCreateCharacter?: () => void;
}

export default function CharacterList({
  onCharacterSelect,
  onCreateCharacter,
}: CharacterListProps) {
  const [characters, setCharacters] = useState<CharacterResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await characterApi.getAll();
      setCharacters(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error("Error loading characters:", apiError);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (characterId: string, characterName: string) => {
    if (!confirm(`Are you sure you want to delete ${characterName}?`)) {
      return;
    }

    try {
      await characterApi.delete(characterId);
      setCharacters(characters.filter((c) => c.id !== characterId));
    } catch (err) {
      const apiError = err as ApiError;
      console.error("Error deleting character:", apiError);
      alert(`Failed to delete character: ${apiError.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">Loading characters...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-red-600">{error.message}</div>
        {error.retryable && (
          <button
            onClick={loadCharacters}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-gray-500">No characters found</div>
        <button
          onClick={onCreateCharacter}
          className="inline-block px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Create Your First Character
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Your Characters</h1>
        <button
          onClick={onCreateCharacter}
          className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
        >
          Create New Character
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {characters.map((character) => (
          <div
            key={character.id}
            className="p-6 transition-shadow bg-white border rounded-lg shadow-sm hover:shadow-md"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="mb-1 text-xl font-semibold text-gray-900">
                  {character.name}
                </h2>
                <p className="text-sm text-gray-600">
                  Level {character.level}{" "}
                  {character.race
                    .replace("_", " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                  {character.multiclasses[0]?.class
                    .replace("_", " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase()) || "Unknown"}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onCharacterSelect?.(character)}
                  className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  View
                </button>
                <button
                  onClick={() => handleDelete(character.id, character.name)}
                  className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:text-red-800 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Hit Points:</span>
                <span className="font-medium">
                  {character.hitPoints.current}/{character.hitPoints.max}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Armor Class:</span>
                <span className="font-medium">{character.armorClass}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Experience:</span>
                <span className="font-medium">
                  {character.experiencePoints}
                </span>
              </div>
              {character.background && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Background:</span>
                  <span className="font-medium">{character.background}</span>
                </div>
              )}
              {character.alignment && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Alignment:</span>
                  <span className="font-medium">
                    {character.alignment
                      .replace("_", " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t">
              <button
                onClick={() => onCharacterSelect?.(character)}
                className="block w-full px-4 py-2 text-center text-white bg-gray-600 rounded-md hover:bg-gray-700"
              >
                Open Character Sheet
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
