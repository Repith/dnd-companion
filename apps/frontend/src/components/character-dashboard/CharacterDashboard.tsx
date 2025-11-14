"use client";

import { useState } from "react";
import { CharacterResponseDto } from "@/types/character";
import { calculateProficiencyBonus } from "./utils";
import { CharacterHeader } from "./CharacterHeader";
import { CharacterTabs } from "./CharacterTabs";
import { OverviewTab } from "./tabs/OverviewTab";
import { DiceRadialMenu } from "../DiceRadialMenu";
import { SpellSlotTracker } from "../SpellSlotTracker";
import { Spellbook } from "../Spellbook";
import { Features } from "../Features";
import RollHistory from "../RollHistory";

export interface CharacterDashboardProps {
  character: CharacterResponseDto;
  onUpdate?: (updates: Partial<CharacterResponseDto>) => void;
}

type CharacterTab = "overview" | "spells" | "features" | "rolls";

export default function CharacterDashboard({
  character,
  onUpdate,
}: CharacterDashboardProps) {
  const [activeTab, setActiveTab] = useState<CharacterTab>("overview");

  const proficiencyBonus = calculateProficiencyBonus(character.level);

  return (
    <div className="p-6 mx-auto space-y-6 max-w-7xl">
      <CharacterHeader
        character={character}
        proficiencyBonus={proficiencyBonus}
      />
      <CharacterTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "overview" && (
        <OverviewTab
          character={character}
          proficiencyBonus={proficiencyBonus}
          onUpdate={onUpdate}
        />
      )}

      <DiceRadialMenu characterId={character.id} />
      {/* Spells */}
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
      {/* Features */}
      {activeTab === "features" && (
        <Features
          character={character}
          onCharacterUpdate={onUpdate || (() => {})}
        />
      )}
      {/* Roll history */}
      {activeTab === "rolls" && <RollHistory characterId={character.id} />}
    </div>
  );
}
