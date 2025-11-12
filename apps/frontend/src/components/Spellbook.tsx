"use client";

import React, { useState, useEffect, useMemo } from "react";
import { SpellResponseDto, SpellSchool } from "@/types/spell";
import { spellApi } from "@/lib/api/spell";
import { CharacterResponseDto } from "@/types/character";
import { characterApi } from "@/lib/api/character";

interface SpellbookProps {
  character: CharacterResponseDto;
  onCharacterUpdate: (character: CharacterResponseDto) => void;
}

export const Spellbook: React.FC<SpellbookProps> = ({
  character,
  onCharacterUpdate,
}) => {
  const [spells, setSpells] = useState<SpellResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<number | "all">("all");
  const [selectedSchool, setSelectedSchool] = useState<SpellSchool | "all">(
    "all",
  );
  const [selectedClass, setSelectedClass] = useState<string>("all");

  // Load all spells on component mount
  useEffect(() => {
    const loadSpells = async () => {
      try {
        const allSpells = await spellApi.getAll();
        setSpells(allSpells);
      } catch (error) {
        console.error("Failed to load spells:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSpells();
  }, []);

  // Filter spells based on search and filters
  const filteredSpells = useMemo(() => {
    return spells.filter((spell) => {
      const matchesSearch =
        spell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spell.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLevel =
        selectedLevel === "all" || spell.level === selectedLevel;
      const matchesSchool =
        selectedSchool === "all" || spell.school === selectedSchool;
      const matchesClass =
        selectedClass === "all" ||
        spell.classes.some((cls) =>
          cls.toLowerCase().includes(selectedClass.toLowerCase()),
        );

      return matchesSearch && matchesLevel && matchesSchool && matchesClass;
    });
  }, [spells, searchTerm, selectedLevel, selectedSchool, selectedClass]);

  // Get unique classes from all spells
  const availableClasses = useMemo(() => {
    const classes = new Set<string>();
    spells.forEach((spell) => {
      spell.classes.forEach((cls) => classes.add(cls));
    });
    return Array.from(classes).sort();
  }, [spells]);

  const handlePrepareSpell = async (spellId: string) => {
    try {
      const updatedCharacter = await characterApi.prepareSpell(
        character.id,
        spellId,
      );
      onCharacterUpdate(updatedCharacter);
    } catch (error) {
      console.error("Failed to prepare spell:", error);
    }
  };

  const handleUnprepareSpell = async (spellId: string) => {
    try {
      const updatedCharacter = await characterApi.unprepareSpell(
        character.id,
        spellId,
      );
      onCharacterUpdate(updatedCharacter);
    } catch (error) {
      console.error("Failed to unprepare spell:", error);
    }
  };

  const isSpellPrepared = (spellId: string) => {
    return character.preparedSpells?.includes(spellId) || false;
  };

  const isSpellKnown = (spellId: string) => {
    return character.knownSpells?.includes(spellId) || false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Spellbook
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {character.preparedSpells?.length || 0} /{" "}
          {character.knownSpells?.length || 0} spells prepared
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 p-4 rounded-lg md:grid-cols-4 bg-gray-50 dark:bg-gray-800">
        {/* Search */}
        <div>
          <label
            htmlFor="search"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Search Spells
          </label>
          <input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Spell name or description..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Level Filter */}
        <div>
          <label
            htmlFor="level"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Level
          </label>
          <select
            id="level"
            value={selectedLevel}
            onChange={(e) =>
              setSelectedLevel(
                e.target.value === "all" ? "all" : parseInt(e.target.value),
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Levels</option>
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i} value={i}>
                {i === 0 ? "Cantrip" : `Level ${i}`}
              </option>
            ))}
          </select>
        </div>

        {/* School Filter */}
        <div>
          <label
            htmlFor="school"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            School
          </label>
          <select
            id="school"
            value={selectedSchool}
            onChange={(e) =>
              setSelectedSchool(e.target.value as SpellSchool | "all")
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Schools</option>
            {Object.values(SpellSchool).map((school) => (
              <option key={school} value={school}>
                {school.charAt(0) + school.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Class Filter */}
        <div>
          <label
            htmlFor="class"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Class
          </label>
          <select
            id="class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Classes</option>
            {availableClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Spell List */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSpells.map((spell) => (
          <div
            key={spell.id}
            className="p-4 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 hover:shadow-md"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {spell.name}
              </h3>
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                  spell.level === 0
                    ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                }`}
              >
                {spell.level === 0 ? "Cantrip" : `Level ${spell.level}`}
              </span>
            </div>

            <div className="mb-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {spell.school && (
                <div>
                  School:{" "}
                  {spell.school.charAt(0) + spell.school.slice(1).toLowerCase()}
                </div>
              )}
              {spell.castingTime && (
                <div>Casting Time: {spell.castingTime}</div>
              )}
              {spell.range && <div>Range: {spell.range}</div>}
              {spell.duration && (
                <div>
                  Duration:{" "}
                  {typeof spell.duration === "object" &&
                  spell.duration.concentration
                    ? `Concentration, ${spell.duration.duration}`
                    : typeof spell.duration === "string"
                    ? spell.duration
                    : spell.duration.duration}
                </div>
              )}
            </div>

            {spell.description && (
              <p className="mb-3 text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                {spell.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Classes: {spell.classes.join(", ")}
              </div>

              {isSpellKnown(spell.id) && (
                <button
                  onClick={() =>
                    isSpellPrepared(spell.id)
                      ? handleUnprepareSpell(spell.id)
                      : handlePrepareSpell(spell.id)
                  }
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    isSpellPrepared(spell.id)
                      ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {isSpellPrepared(spell.id) ? "Prepared" : "Prepare"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredSpells.length === 0 && (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          No spells found matching your criteria.
        </div>
      )}
    </div>
  );
};
