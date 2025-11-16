import { AbilityName, CharacterResponseDto } from "@/types/character";
import { getModifierDisplay, getSavingThrowModifier } from "../utils";
import { useCharacterEventBus } from "@/contexts/CharacterEventBus";

interface SavingThrowsCardProps {
  character: CharacterResponseDto;
  proficiencyBonus: number;
}

const ABILITIES = [
  AbilityName.STRENGTH,
  AbilityName.DEXTERITY,
  AbilityName.CONSTITUTION,
  AbilityName.INTELLIGENCE,
  AbilityName.WISDOM,
  AbilityName.CHARISMA,
];

export const SavingThrowsCard: React.FC<SavingThrowsCardProps> = ({
  character,
  proficiencyBonus,
}) => {
  const { updateSavingThrowProficiency } = useCharacterEventBus();

  const handleToggleProficiency = async (ability: AbilityName) => {
    const isProficient = !!character.savingThrows?.[ability];
    await updateSavingThrowProficiency(character.id, ability, !isProficient);
  };

  return (
    <section className="p-5 border shadow-sm rounded-2xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-900/80">
      <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-300">
        Saving Throws
      </h2>

      <div className="space-y-1 text-sm">
        {ABILITIES.map((ability) => {
          const isProficient = !!character.savingThrows?.[ability];
          const modifier = getSavingThrowModifier(
            character,
            ability,
            proficiencyBonus,
          );

          return (
            <button
              key={ability}
              type="button"
              onClick={() => handleToggleProficiency(ability)}
              className="flex items-center justify-between w-full px-3 py-2 text-left transition-colors rounded-xl hover:bg-emerald-50/70 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-3 w-3 items-center justify-center rounded-full border text-[0.6rem] ${
                    isProficient
                      ? "border-emerald-500 bg-emerald-500 text-slate-900"
                      : "border-slate-400 text-slate-400"
                  }`}
                >
                  {isProficient ? "●" : ""}
                </span>
                <span className="font-medium capitalize text-slate-800 dark:text-slate-50">
                  {ability.toLowerCase()}
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
