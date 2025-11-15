// character-dashboard/overview/AbilitiesPanel.tsx
import { AbilityName, CharacterResponseDto } from "@/types/character";
import { AbilityCard } from "./AbilityCard";
import { ProficiencyBonusCard } from "./ProficiencyBonusCard";
import { HeroicInspirationCard } from "./HeroicInspirationCard";

interface AbilitiesPanelProps {
  character: CharacterResponseDto;
  proficiencyBonus: number;
  onUpdate: (updates: Partial<CharacterResponseDto>) => void;
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
  onUpdate,
}) => {
  return (
    <section className="space-y-4">
      <ProficiencyBonusCard proficiencyBonus={proficiencyBonus} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ABILITIES.map((ability) => (
          <AbilityCard
            key={ability}
            character={character}
            ability={ability}
            proficiencyBonus={proficiencyBonus}
            onUpdate={onUpdate}
          />
        ))}
      </div>

      <HeroicInspirationCard
        inspiration={character.inspiration}
        onToggle={() => onUpdate?.({ inspiration: !character.inspiration })}
      />
    </section>
  );
};
