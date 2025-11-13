"use client";

import { useState } from "react";
import { CharacterResponseDto, AbilityName } from "@/types/character";
import { Spellbook } from "./Spellbook";
import { SpellSlotTracker } from "./SpellSlotTracker";
import { Features } from "./Features";
import RollHistory from "./RollHistory";
import { DiceRadialMenu } from "./DiceRadialMenu";

interface CharacterDashboardProps {
  character: CharacterResponseDto;
  onUpdate?: (updates: Partial<CharacterResponseDto>) => void;
}

export default function CharacterDashboard({
  character,
  onUpdate,
}: CharacterDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "spells" | "features" | "rolls"
  >("overview");

  const level = character.level;
  const proficiencyBonus = Math.ceil(level / 4) + 1;

  const calculateModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const getModifierDisplay = (modifier: number): string => {
    return modifier >= 0 ? `+${modifier}` : modifier.toString();
  };

  const getSkillModifier = (skillName: string): number => {
    const skill = character.skillProficiencies.find(
      (s) => s.skill === skillName,
    );
    if (!skill) return 0;

    // Map skill to ability
    const skillToAbility: Record<string, AbilityName> = {
      ACROBATICS: AbilityName.DEXTERITY,
      ANIMAL_HANDLING: AbilityName.WISDOM,
      ARCANA: AbilityName.INTELLIGENCE,
      ATHLETICS: AbilityName.STRENGTH,
      DECEPTION: AbilityName.CHARISMA,
      HISTORY: AbilityName.INTELLIGENCE,
      INSIGHT: AbilityName.WISDOM,
      INTIMIDATION: AbilityName.CHARISMA,
      INVESTIGATION: AbilityName.INTELLIGENCE,
      MEDICINE: AbilityName.WISDOM,
      NATURE: AbilityName.INTELLIGENCE,
      PERCEPTION: AbilityName.WISDOM,
      PERFORMANCE: AbilityName.CHARISMA,
      PERSUASION: AbilityName.CHARISMA,
      RELIGION: AbilityName.INTELLIGENCE,
      SLEIGHT_OF_HAND: AbilityName.DEXTERITY,
      STEALTH: AbilityName.DEXTERITY,
      SURVIVAL: AbilityName.WISDOM,
    };

    const ability = skillToAbility[skillName] || AbilityName.STRENGTH;
    const abilityScore =
      character.abilityScores?.[
        ability.toLowerCase() as keyof typeof character.abilityScores
      ] || 10;
    const baseModifier = calculateModifier(Number(abilityScore));
    const proficiencyMultiplier = skill.expertise
      ? 2
      : skill.proficient
      ? 1
      : 0;
    return baseModifier + proficiencyMultiplier * proficiencyBonus;
  };

  const getSavingThrowModifier = (ability: AbilityName): number => {
    const abilityScore =
      character.abilityScores?.[
        ability.toLowerCase() as keyof typeof character.abilityScores
      ] || 10;
    const baseModifier = calculateModifier(Number(abilityScore));
    const isProficient = character.savingThrows?.[ability.toLowerCase()];
    return baseModifier + (isProficient ? proficiencyBonus : 0);
  };

  return (
    <div className="p-6 mx-auto space-y-6 max-w-7xl">
      {/* Header */}
      <div className="p-6 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {character.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Level {character.level}{" "}
              {character.race
                .replace("_", " ")
                .toLowerCase()
                .replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
              {character.multiclasses[0]?.class
                .replace("_", " ")
                .toLowerCase()
                .replace(/\b\w/g, (l: string) => l.toUpperCase()) || "Unknown"}
              {character.background && ` • ${character.background}`}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="flex border-b dark:border-gray-700">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("spells")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "spells"
                ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Spells
          </button>
          <button
            onClick={() => setActiveTab("features")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "features"
                ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Features & Traits
          </button>
          <button
            onClick={() => setActiveTab("rolls")}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "rolls"
                ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Roll History
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Stats */}
          <div className="space-y-6">
            {/* Ability Scores */}
            <div className="p-6 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Ability Scores
              </h2>
              <div className="space-y-3">
                {character.abilityScores && (
                  <>
                    {Object.entries(character.abilityScores).map(
                      ([ability, score]) => {
                        if (ability === "id") return null;
                        const modifier = calculateModifier(Number(score));
                        const abilityName =
                          ability.charAt(0).toUpperCase() + ability.slice(1);

                        return (
                          <div
                            key={ability}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
                          >
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {abilityName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {score}
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {getModifierDisplay(modifier)}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Combat Stats */}
            <div className="p-6 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Combat
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Hit Points:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {character.hitPoints.current}/{character.hitPoints.max}
                    {character.hitPoints.temporary > 0 &&
                      ` (+${character.hitPoints.temporary})`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Armor Class:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {character.armorClass}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Initiative:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getModifierDisplay(character.initiative)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Speed:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {character.speed} ft
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Proficiency Bonus:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getModifierDisplay(proficiencyBonus)}
                  </span>
                </div>
              </div>
            </div>

            {/* Currency */}
            <div className="p-6 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Currency
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 text-center rounded bg-yellow-50 dark:bg-yellow-900">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {character.currency.gp}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Gold
                  </div>
                </div>
                <div className="p-2 text-center rounded bg-gray-50 dark:bg-gray-700">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {character.currency.sp}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Silver
                  </div>
                </div>
                <div className="p-2 text-center rounded bg-orange-50 dark:bg-orange-900">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {character.currency.ep}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Electrum
                  </div>
                </div>
                <div className="p-2 text-center rounded bg-green-50 dark:bg-green-900">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {character.currency.cp}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Copper
                  </div>
                </div>
                <div className="col-span-2 p-2 text-center rounded bg-purple-50 dark:bg-purple-900">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {character.currency.pp}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Platinum
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Skills & Saves */}
          <div className="space-y-6">
            {/* Saving Throws */}
            <div className="p-6 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Saving Throws
              </h2>
              <div className="space-y-2">
                {(
                  [
                    "STRENGTH",
                    "DEXTERITY",
                    "CONSTITUTION",
                    "INTELLIGENCE",
                    "WISDOM",
                    "CHARISMA",
                  ] as AbilityName[]
                ).map((ability) => {
                  const modifier = getSavingThrowModifier(ability);
                  const isProficient =
                    character.savingThrows?.[ability.toLowerCase()];

                  return (
                    <div
                      key={ability}
                      className="flex items-center justify-between p-2 rounded"
                    >
                      <div className="flex items-center space-x-2">
                        {isProficient && (
                          <span className="text-green-600 dark:text-green-400">
                            ●
                          </span>
                        )}
                        <span className="text-gray-900 capitalize dark:text-white">
                          {ability.toLowerCase()}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-gray-900 dark:text-white">
                        {getModifierDisplay(modifier)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Skills */}
            <div className="p-6 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Skills
              </h2>
              <div className="space-y-2 overflow-y-auto max-h-96">
                {character.skillProficiencies.map((skillProf) => {
                  const modifier = getSkillModifier(skillProf.skill);
                  const skillName = skillProf.skill
                    .replace("_", " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase());

                  return (
                    <div
                      key={skillProf.id}
                      className="flex items-center justify-between p-2 rounded"
                    >
                      <div className="flex items-center space-x-2">
                        {skillProf.expertise && (
                          <span className="text-blue-600 dark:text-blue-400">
                            ⬡
                          </span>
                        )}
                        {skillProf.proficient && !skillProf.expertise && (
                          <span className="text-green-600 dark:text-green-400">
                            ●
                          </span>
                        )}
                        <span className="text-gray-900 dark:text-white">
                          {skillName}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-gray-900 dark:text-white">
                        {getModifierDisplay(modifier)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Character Info */}
            <div className="p-6 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Character Info
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Race:
                  </span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {character.race
                      .replace("_", " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    {character.subrace && ` (${character.subrace})`}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Class:
                  </span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {character.multiclasses[0]?.class
                      .replace("_", " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (l: string) => l.toUpperCase()) ||
                      "Unknown"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Level:
                  </span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {character.level}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Background:
                  </span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {character.background || "None"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Alignment:
                  </span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {character.alignment
                      ?.replace("_", " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (l) => l.toUpperCase()) || "None"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Experience:
                  </span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {character.experiencePoints}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Inspiration:
                  </span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {character.inspiration ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>

            {/* Languages */}
            <div className="p-6 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Languages
              </h2>
              <div className="flex flex-wrap gap-2">
                {character.languages.map((language, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-sm text-blue-800 bg-blue-100 rounded dark:bg-blue-900 dark:text-blue-300"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <DiceRadialMenu characterId={character.id} />
      {/* Spells Tab */}
      {activeTab === "spells" && (
        <div className="space-y-6">
          <SpellSlotTracker
            character={character}
            onCharacterUpdate={onUpdate || (() => {})}
          />
          <Spellbook
            character={character}
            onCharacterUpdate={onUpdate || (() => {})}
          />
        </div>
      )}

      {/* Features Tab */}
      {activeTab === "features" && (
        <Features
          character={character}
          onCharacterUpdate={onUpdate || (() => {})}
        />
      )}

      {/* Roll History Tab */}
      {activeTab === "rolls" && <RollHistory characterId={character.id} />}
    </div>
  );
}
