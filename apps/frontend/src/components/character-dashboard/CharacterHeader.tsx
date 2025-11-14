import { CharacterResponseDto } from "@/types/character";
import { formatEnumLabel, getModifierDisplay } from "./utils";

interface CharacterHeaderProps {
  character: CharacterResponseDto;
  proficiencyBonus: number;
}

export const CharacterHeader: React.FC<CharacterHeaderProps> = ({
  character,
  proficiencyBonus,
}) => {
  const primaryClass =
    character.multiclasses[0]?.class?.toString() ?? "Unknown";

  const raceLabel = formatEnumLabel(character.race);
  const classLabel = formatEnumLabel(primaryClass);
  const alignmentLabel = formatEnumLabel(character.alignment || "");

  return (
    <section className="px-6 py-4 border shadow-sm rounded-2xl border-slate-200 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 dark:border-slate-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {character.name}
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Level {character.level} {raceLabel} {classLabel}
            {character.background && ` • ${character.background}`}
          </p>
          {alignmentLabel && (
            <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-400">
              {alignmentLabel}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs text-right text-slate-200 md:grid-cols-4">
          <HeaderStat
            label="HP"
            value={`${character.hitPoints.current}/${character.hitPoints.max}`}
            accent
          />
          <HeaderStat label="AC" value={character.armorClass} />
          <HeaderStat
            label="Prof. Bonus"
            value={getModifierDisplay(proficiencyBonus)}
          />
          <HeaderStat
            label="Speed"
            value={`${character.speed} ft`}
            className="hidden md:block"
          />
        </div>
      </div>
    </section>
  );
};

interface HeaderStatProps {
  label: string;
  value: string | number;
  accent?: boolean;
  className?: string;
}

const HeaderStat: React.FC<HeaderStatProps> = ({
  label,
  value,
  accent,
  className,
}) => (
  <div
    className={`flex flex-col items-end rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 ${className}`}
  >
    <span className="text-[0.68rem] font-medium uppercase tracking-wide text-slate-400">
      {label}
    </span>
    <span
      className={`text-lg font-semibold ${
        accent ? "text-emerald-400" : "text-slate-50"
      }`}
    >
      {value}
    </span>
  </div>
);
