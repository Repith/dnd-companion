"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CharacterList from "@/components/CharacterList";
import CharacterDashboard from "@/components/CharacterDashboard";
import { CharacterResponseDto } from "@/types/character";

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

  if (selectedCharacter) {
    return (
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
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <CharacterList onCharacterSelect={handleCharacterSelect} />
      </div>
    </div>
  );
}
