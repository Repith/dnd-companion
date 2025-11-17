"use client";

import { AbilityName, CharacterResponseDto } from "@/types/character";
import { AbilityCard } from "./AbilityCard";

interface AbilitiesPanelProps {
  character: CharacterResponseDto;
  proficiencyBonus: number;
  onUpdate?: (updates: Partial<CharacterResponseDto>) => void;
}

const ABILITIES = [
  AbilityName.STRENGTH,
  AbilityName.DEXTERITY,
  AbilityName.CONSTITUTION,
  AbilityName.INTELLIGENCE,
  AbilityName.WISDOM,
  AbilityName.CHARISMA,
];

export const AbilitiesPanel: React.FC<AbilitiesPanelProps> = ({
  character,
  proficiencyBonus,
}) => {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ABILITIES.map((ability) => (
        <AbilityCard
          key={ability}
          character={character}
          ability={ability}
          proficiencyBonus={proficiencyBonus}
        />
      ))}
    </section>
  );
};
