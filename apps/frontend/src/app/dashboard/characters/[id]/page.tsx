"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CharacterResponseDto } from "@/types/character";
import { characterApi } from "@/lib/api/character";
import { useCharacterEventBus } from "@/contexts/CharacterEventBus";
import CharacterDashboard from "@/components/character-dashboard/CharacterDashboard";

export default function CharacterDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [character, setCharacter] = useState<CharacterResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the event bus for character updates
  const { updateCharacter } = useCharacterEventBus();

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
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error("Error loading character:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterUpdate = async (
    updates: Partial<CharacterResponseDto>,
  ) => {
    try {
      // Use event bus to update character - handles API calls and events properly
      const updatedCharacter = await updateCharacter(id, updates as any);

      // Update local state with the returned character data
      setCharacter(updatedCharacter);
      setError(null); // Clear any previous errors
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      console.error("Failed to update character:", err);
      setError(errorMessage);
      // Optionally show error to user
    }
  };

  // Helper function to extract error messages from various error types
  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === "object" && err !== null) {
      if ("message" in err && typeof err.message === "string") {
        return err.message;
      }
      if ("error" in err && typeof err.error === "string") {
        return err.error;
      }
      // Handle nested error objects from backend
      if (
        "response" in err &&
        err.response &&
        typeof err.response === "object"
      ) {
        if (
          "data" in err.response &&
          err.response.data &&
          typeof err.response.data === "object"
        ) {
          if ("message" in err.response.data) {
            const message = err.response.data.message;
            if (typeof message === "string") {
              return message;
            }
          }
        }
      }
    }
    return "An unexpected error occurred";
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
        <div className="mb-4 text-red-600">{error}</div>
        <button
          onClick={loadCharacter}
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
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
