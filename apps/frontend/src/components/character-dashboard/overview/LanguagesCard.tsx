interface LanguagesCardProps {
  languages: string[];
}

export const LanguagesCard: React.FC<LanguagesCardProps> = ({ languages }) => {
  if (!languages?.length) return null;

  return (
    <section className="p-5 border shadow-sm rounded-2xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-900/80">
      <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-300">
        Languages
      </h2>
      <div className="flex flex-wrap gap-2 text-xs">
        {languages.map((language, index) => (
          <span
            key={`${language}-${index}`}
            className="px-3 py-1 font-medium border rounded-full border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-600/60 dark:bg-emerald-900/40 dark:text-emerald-200"
          >
            {language}
          </span>
        ))}
      </div>
    </section>
  );
};
