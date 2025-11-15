"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Plus, X } from "lucide-react";
import { CharacterResponseDto } from "@/types/character";
import { characterApi } from "@/lib/api/character";
import { ApiError } from "@/lib/api/error-handler";
import { useAuth } from "@/contexts/AuthContext";
import CharacterBuilder from "@/components/character-builder/CharacterBuilder";

export default function CharacterList() {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<CharacterResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadCharacters();
  }, [user]);

  const loadCharacters = async () => {
    try {
      setLoading(true);
      setError(null);

      if (user) {
        const data = await characterApi.getAll();
        setCharacters(data);
      } else {
        setCharacters([]);
      }
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

  const handleCharacterCreated = async (character: any) => {
    setShowCreateModal(false);
    await loadCharacters(); // Refresh the character list
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-b-2 rounded-full border-accent animate-spin"></div>
        <span className="ml-2 text-foreground">Loading characters...</span>
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
            className="px-4 py-2 rounded-md text-background bg-accent hover:bg-foreground"
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
        <div className="mb-4 text-accent">
          No characters yet. Create your first one!
        </div>
        <Link
          href="/dashboard/characters/create"
          className="inline-block px-4 py-2 rounded-md text-background bg-accent hover:bg-foreground"
        >
          Create Your First Character
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center">
        <h1 className="text-3xl font-bold text-foreground">Your Characters</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {characters.map((character) => (
          <div
            key={character.id}
            className="group relative bg-gradient-to-br from-background to-accent border border-accent rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden"
          >
            {/* Avatar Section */}
            <div className="relative flex items-center justify-center h-32 bg-gradient-to-br from-accent to-foreground">
              {character.avatarUrl ? (
                <img
                  src={character.avatarUrl}
                  alt={`${character.name} avatar`}
                  className="object-cover w-20 h-20 border-4 rounded-full shadow-md border-background"
                />
              ) : (
                <div className="flex items-center justify-center w-20 h-20 border-4 rounded-full shadow-md bg-accent border-background">
                  <User className="w-10 h-10 text-foreground" />
                </div>
              )}

              {/* Action buttons overlay */}
              <div className="absolute flex space-x-1 transition-opacity duration-300 opacity-0 top-2 right-2 group-hover:opacity-100">
                <Link
                  href={`/dashboard/characters/${character.id}`}
                  className="p-2 transition-colors rounded-lg shadow-md bg-foreground text-background hover:bg-accent"
                  title="View Character"
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </Link>
                <button
                  onClick={() => handleDelete(character.id, character.name)}
                  className="p-2 text-white transition-colors bg-red-600 rounded-lg shadow-md hover:bg-red-700"
                  title="Delete Character"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4">
              {/* Name and Level */}
              <div className="mb-3">
                <h3 className="mb-1 text-lg font-bold truncate text-foreground">
                  {character.name}
                </h3>
                <p className="text-sm font-medium text-accent">
                  Level {character.level}
                </p>
              </div>

              {/* Race and Class */}
              <div className="mb-3 space-y-1">
                <p className="text-sm text-accent">
                  <span className="font-medium">Race:</span>{" "}
                  {character.race
                    .replace("_", " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </p>
                <p className="text-sm text-accent">
                  <span className="font-medium">Class:</span>{" "}
                  {character.multiclasses[0]?.class
                    .replace("_", " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase()) || "Unknown"}
                </p>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="p-2 text-center rounded-lg bg-accent">
                  <div className="font-bold text-foreground">
                    {character.hitPoints.current}/{character.hitPoints.max}
                  </div>
                  <div className="text-foreground">HP</div>
                </div>
                <div className="p-2 text-center rounded-lg bg-accent">
                  <div className="font-bold text-foreground">
                    {character.armorClass}
                  </div>
                  <div className="text-foreground">AC</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-1 text-xs text-accent">
                {character.background && (
                  <p>
                    <span className="font-medium">Background:</span>{" "}
                    {character.background}
                  </p>
                )}
                {character.alignment && (
                  <p>
                    <span className="font-medium">Alignment:</span>{" "}
                    {character.alignment
                      .replace("_", " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </p>
                )}
                <p>
                  <span className="font-medium">XP:</span>{" "}
                  {character.experiencePoints.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Clickable overlay */}
            <Link
              href={`/dashboard/characters/${character.id}`}
              className="absolute inset-0 z-10"
              aria-label={`View ${character.name}'s character sheet`}
            />
          </div>
        ))}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed z-50 bottom-16 right-4 md:bottom-4 group"
      >
        <div className="px-3 py-3 overflow-hidden transition-all duration-300 rounded-full shadow-lg bg-accent hover:bg-foreground text-background">
          <div className="flex items-center">
            <span className="w-0 overflow-hidden text-sm transition-all duration-300 group-hover:w-48 whitespace-nowrap">
              Create New Character
            </span>
            <Plus className="flex-shrink-0 w-6 h-6 ml-0 transition-all duration-300 group-hover:ml-2" />
          </div>
        </div>
      </button>

      {/* Character Creation Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="character-create-modal-title"
        >
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-opacity-75 bg-foreground"
              onClick={() => setShowCreateModal(false)}
              aria-hidden="true"
            ></div>

            <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all duration-300 transform rounded-lg shadow-xl bg-background">
              <div className="flex items-center justify-between mb-6">
                <h2
                  id="character-create-modal-title"
                  className="text-2xl font-bold text-foreground"
                >
                  Create New Character
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-full text-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <CharacterBuilder onComplete={handleCharacterCreated} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
