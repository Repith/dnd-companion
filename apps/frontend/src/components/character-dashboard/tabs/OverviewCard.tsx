import { CharacterResponseDto } from "@/types/character";
import { CombatCard } from "../overview/CombatCard";
import { CurrencyCard } from "../overview/CurrencyCard";
import { CharacterInfoCard } from "../overview/CharacterInfoCard";
import { LanguagesCard } from "../overview/LanguagesCard";
import { AbilitiesPanel } from "../overview/AbilitiesPanel";

interface OverviewCardProps {
  character: CharacterResponseDto;
  proficiencyBonus: number;
  onUpdate: (updates: Partial<CharacterResponseDto>) => void;
}

export const OverviewCard: React.FC<OverviewCardProps> = ({
  character,
  proficiencyBonus,
  onUpdate,
}) => {
  return (
    <section className="grid grid-cols-1 gap-6">
      <div className="lg:col-span-1">
        <AbilitiesPanel
          character={character}
          proficiencyBonus={proficiencyBonus}
          onUpdate={onUpdate}
        />
      </div>

      <div className="space-y-6">
        <CombatCard character={character} proficiencyBonus={proficiencyBonus} />
        <CurrencyCard currency={character.currency} />
      </div>

      <div className="space-y-6">
        <CharacterInfoCard character={character} />
        <LanguagesCard languages={character.languages} />
      </div>
    </section>
  );
};
