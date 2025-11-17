import React from "react";
import type { CharacterResponseDto } from "@/types/character";
import { SpellSlotTracker } from "@/components/SpellSlotTracker";
import { Spellbook } from "@/components/Spellbook";

interface SpellsTabProps {
  character: CharacterResponseDto;
  onSpellSlotUpdate: (character: CharacterResponseDto) => void;
  onSpellbookUpdate: (character: CharacterResponseDto) => void;
}

export const SpellsTab: React.FC<SpellsTabProps> = ({
  character,
  onSpellSlotUpdate,
  onSpellbookUpdate,
}) => (
  <div className="space-y-6">
    <SpellSlotTracker
      character={character}
      onCharacterUpdate={onSpellSlotUpdate}
    />
    <Spellbook character={character} onCharacterUpdate={onSpellbookUpdate} />
  </div>
);
