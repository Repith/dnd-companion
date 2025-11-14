// character-dashboard/overview/ProficiencyBonusCard.tsx
import { Medal } from "lucide-react";
import { getModifierDisplay } from "../utils";

interface ProficiencyBonusCardProps {
  proficiencyBonus: number;
}

export const ProficiencyBonusCard: React.FC<ProficiencyBonusCardProps> = ({
  proficiencyBonus,
}) => {
  return (
    <section className="p-4 border shadow-sm rounded-2xl border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900/90">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Medal className="w-5 h-5 text-emerald-500" />
          <div className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-300">
            Proficiency Bonus
          </div>
        </div>
        <div className="flex items-center justify-center w-12 h-12 text-lg font-bold border-2 rounded-full border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-200">
          {getModifierDisplay(proficiencyBonus)}
        </div>
      </div>
    </section>
  );
};
