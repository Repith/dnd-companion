import { CharacterResponseDto } from "@/types/character";
import { formatEnumLabel } from "../utils";

interface CharacterInfoCardProps {
  character: CharacterResponseDto;
}

export const CharacterInfoCard: React.FC<CharacterInfoCardProps> = ({
  character,
}) => {
  const primaryClass =
    character.multiclasses[0]?.class?.toString() ?? "Unknown";

  return (
    <section className="p-5 border shadow-sm rounded-2xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-900/80">
      <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-300">
        Character Info
      </h2>
      <dl className="space-y-2 text-sm">
        <InfoRow label="Race">
          {formatEnumLabel(character.race)}
          {character.subrace && ` (${character.subrace})`}
        </InfoRow>
        <InfoRow label="Class">{formatEnumLabel(primaryClass)}</InfoRow>
        <InfoRow label="Level">{character.level}</InfoRow>
        <InfoRow label="Background">{character.background || "None"}</InfoRow>
        <InfoRow label="Alignment">
          {formatEnumLabel(character.alignment || "") || "None"}
        </InfoRow>
        <InfoRow label="Experience">{character.experiencePoints}</InfoRow>
        <InfoRow label="Inspiration">
          {character.inspiration ? "Yes" : "No"}
        </InfoRow>
      </dl>
    </section>
  );
};

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex items-center justify-between gap-4">
    <dt className="text-slate-600 dark:text-slate-300">{label}</dt>
    <dd className="font-medium text-right text-slate-900 dark:text-slate-50">
      {children}
    </dd>
  </div>
);
