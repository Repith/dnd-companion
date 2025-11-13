"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import CharacterDashboard from "@/components/CharacterDashboard";
import { CharacterResponseDto } from "@/types/character";
import { characterApi } from "@/lib/api/character";
import { useCharacter } from "@/contexts/CharacterContext";

export default function CharacterPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedCharacter, setSelectedCharacter } = useCharacter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const characterId = params.id as string;

  useEffect(() => {
    if (characterId) {
      loadCharacter();
    }
  }, [characterId]);

  const loadCharacter = async () => {
    try {
      setLoading(true);
      const data = await characterApi.getById(characterId);
      setSelectedCharacter(data);
    } catch (err) {
      setError("Failed to load character");
      console.error("Error loading character:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updates: Partial<CharacterResponseDto>) => {
    if (!selectedCharacter) return;

    try {
      // Transform the updates to match UpdateCharacterDto
      const transformedUpdates: any = { ...updates };

      // Transform skillProficiencies if present
      if (updates.skillProficiencies) {
        transformedUpdates.skillProficiencies = updates.skillProficiencies.map(
          (sp) => ({
            skill: sp.skill as any, // Cast to SkillName
            proficient: sp.proficient,
            expertise: sp.expertise,
          }),
        );
      }

      const updatedCharacter = await characterApi.update(
        selectedCharacter.id,
        transformedUpdates,
      );
      setSelectedCharacter(updatedCharacter);
    } catch (err) {
      console.error("Error updating character:", err);
      alert("Failed to update character");
    }
  };

  return (
    <ProtectedRoute>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading character...</p>
          </div>
        </div>
      ) : error || !selectedCharacter ? (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="mb-4 text-red-600">
              {error || "Character not found"}
            </div>
            <button
              onClick={() => router.push("/characters")}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Back to Characters
            </button>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50">
          <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="mb-6">
              <button
                onClick={() => router.push("/characters")}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                ← Back to Characters
              </button>
            </div>
            <CharacterDashboard
              character={selectedCharacter}
              onUpdate={handleUpdate}
            />
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
