"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CharacterResponseDto } from "@/types/character";
import { characterApi } from "@/lib/api/character";
import { ApiError } from "@/lib/api/error-handler";
import CharacterDashboard from "@/components/character-dashboard/CharacterDashboard";

export default function CharacterDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [character, setCharacter] = useState<CharacterResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    loadCharacter();
  }, [id]);

  const loadCharacter = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await characterApi.getById(id);
      setCharacter(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      console.error("Error loading character:", apiError);
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterUpdate = async (
    updates: Partial<CharacterResponseDto>,
  ) => {
    try {
      await characterApi.update(id, updates as any);
      await loadCharacter();
    } catch (error) {
      console.error("Failed to update character:", error);
      // Optionally show error to user
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">Loading character...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-red-600">{error.message}</div>
        {error.retryable && (
          <button
            onClick={loadCharacter}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (!character) {
    return (
      <div className="py-12 text-center">
        <div className="text-gray-500">Character not found</div>
      </div>
    );
  }

  return (
    <CharacterDashboard
      character={character}
      onUpdate={handleCharacterUpdate}
    />
  );
}
