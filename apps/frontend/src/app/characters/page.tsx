"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import CharacterList from "@/components/CharacterList";
import { CharacterResponseDto } from "@/types/character";
import CharacterDashboard from "@/components/character-dashboard/CharacterDashboard";

export default function CharactersPage() {
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterResponseDto | null>(null);
  const router = useRouter();

  const handleCharacterSelect = (character: CharacterResponseDto) => {
    setSelectedCharacter(character);
  };

  const handleBackToList = () => {
    setSelectedCharacter(null);
  };

  return (
    <ProtectedRoute>
      {selectedCharacter ? (
        <div className="min-h-screen bg-gray-50">
          <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="mb-6">
              <button
                onClick={handleBackToList}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                ← Back to Characters
              </button>
            </div>
            <CharacterDashboard character={selectedCharacter} />
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50">
          <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <CharacterList />
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
