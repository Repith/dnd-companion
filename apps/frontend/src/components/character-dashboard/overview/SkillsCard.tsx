import { useDiceRoller } from "@/contexts/dice-roller";
import { CharacterResponseDto } from "@/types/character";
import { getModifierDisplay, getSkillModifier } from "../utils";

interface SkillsCardProps {
  character: CharacterResponseDto;
  proficiencyBonus: number;
}

export const SkillsCard: React.FC<SkillsCardProps> = ({
  character,
  proficiencyBonus,
}) => {
  const { isReady, roll } = useDiceRoller();

  const handleSkillClick = async (
    skill: (typeof character.skillProficiencies)[number],
  ) => {
    if (!isReady) return;

    const modifier = getSkillModifier(character, skill.skill, proficiencyBonus);
    const prettyName = formatSkillName(skill.skill);

    try {
      await roll(
        [
          // Załóżmy 1d20 + modifier – dopasuj strukturę DiceNotation do swojego providera
          {
            notation:
              modifier === 0
                ? "1d20"
                : `1d20${modifier > 0 ? `+${modifier}` : modifier}`,
          } as any,
        ],
        {
          label: `${prettyName} check`,
        } as any,
        character.id,
      );
    } catch (error) {
      // Możesz to później podpiąć pod toast / logowanie
      console.error("Skill roll failed", error);
    }
  };

  return (
    <section className="p-5 border shadow-sm rounded-2xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-900/80">
      <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-300">
        Skills
      </h2>
      <div className="max-h-96 space-y-1.5 overflow-y-auto text-sm">
        {character.skillProficiencies.map((skillProf) => {
          const modifier = getSkillModifier(
            character,
            skillProf.skill,
            proficiencyBonus,
          );
          const skillName = formatSkillName(skillProf.skill);

          return (
            <button
              key={skillProf.id}
              type="button"
              onClick={() => handleSkillClick(skillProf)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-emerald-50/60 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-2">
                {skillProf.expertise && (
                  <span className="inline-flex h-3 w-3 items-center justify-center rounded-full border border-emerald-500 text-[0.6rem] text-emerald-500">
                    ⬡
                  </span>
                )}
                {skillProf.proficient && !skillProf.expertise && (
                  <span className="inline-flex h-3 w-3 items-center justify-center rounded-full border border-emerald-400 text-[0.6rem] text-emerald-400">
                    ●
                  </span>
                )}
                <span className="text-slate-900 dark:text-slate-50">
                  {skillName}
                </span>
              </div>
              <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-50">
                {getModifierDisplay(modifier)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

const formatSkillName = (raw: string): string =>
  raw
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
