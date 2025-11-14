import { CharacterResponseDto } from "@/types/character";
import { getModifierDisplay } from "../utils";

interface CombatCardProps {
  character: CharacterResponseDto;
  proficiencyBonus: number;
}

export const CombatCard: React.FC<CombatCardProps> = ({
  character,
  proficiencyBonus,
}) => {
  const { hitPoints } = character;

  return (
    <section className="p-5 border shadow-sm rounded-2xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-900/80">
      <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-300">
        Combat
      </h2>
      <dl className="space-y-2 text-sm">
        <Row label="Hit Points">
          <span className="font-semibold text-slate-900 dark:text-slate-50">
            {hitPoints.current}/{hitPoints.max}
            {hitPoints.temporary > 0 && ` (+${hitPoints.temporary})`}
          </span>
        </Row>
        <Row label="Armor Class">
          <span className="font-semibold text-slate-900 dark:text-slate-50">
            {character.armorClass}
          </span>
        </Row>
        <Row label="Initiative">
          <span className="font-mono font-semibold text-slate-900 dark:text-slate-50">
            {getModifierDisplay(character.initiative)}
          </span>
        </Row>
        <Row label="Speed">
          <span className="font-semibold text-slate-900 dark:text-slate-50">
            {character.speed} ft
          </span>
        </Row>
        <Row label="Proficiency Bonus">
          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-300">
            {getModifierDisplay(proficiencyBonus)}
          </span>
        </Row>
      </dl>
    </section>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex items-center justify-between">
    <dt className="text-slate-600 dark:text-slate-300">{label}</dt>
    <dd>{children}</dd>
  </div>
);
