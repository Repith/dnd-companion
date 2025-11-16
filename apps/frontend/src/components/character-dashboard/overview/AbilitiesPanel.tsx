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
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-300">
            Abilities
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
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
        </div>

        <div className="space-y-3">
          <ProficiencyBonusCard proficiencyBonus={proficiencyBonus} />

          <HeroicInspirationCard
            inspiration={character.inspiration}
            onToggle={() => onUpdate?.({ inspiration: !character.inspiration })}
          />
        </div>
      </div>
    </section>
  );
};
