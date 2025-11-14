import { Sparkles } from "lucide-react";

interface HeroicInspirationCardProps {
  inspiration: boolean;
  onToggle?: () => void;
}

export const HeroicInspirationCard: React.FC<HeroicInspirationCardProps> = ({
  inspiration,
  onToggle,
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left shadow-sm transition-colors ${
        inspiration
          ? "border-yellow-400 bg-yellow-50/80 dark:border-yellow-500 dark:bg-yellow-900/40"
          : "border-slate-200 bg-white/90 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/90 dark:hover:bg-slate-800"
      }`}
    >
      <div className="flex items-center gap-2">
        <Sparkles
          className={`h-5 w-5 ${
            inspiration
              ? "text-yellow-500 dark:text-yellow-300"
              : "text-slate-400 dark:text-slate-500"
          }`}
        />
        <div>
          <div className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-300">
            Heroic Inspiration
          </div>
          <div className="text-sm text-slate-800 dark:text-slate-100">
            {inspiration ? "Inspired" : "Not inspired"}
          </div>
        </div>
      </div>
    </button>
  );
};
