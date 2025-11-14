interface CharacterTabsProps {
  activeTab: "overview" | "spells" | "features" | "rolls";
  onTabChange: (tab: "overview" | "spells" | "features" | "rolls") => void;
}

const TABS: {
  id: CharacterTabsProps["activeTab"];
  label: string;
}[] = [
  { id: "overview", label: "Overview" },
  { id: "spells", label: "Spells" },
  { id: "features", label: "Features & Traits" },
  { id: "rolls", label: "Roll History" },
];

export const CharacterTabs: React.FC<CharacterTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <nav className="border shadow-sm rounded-2xl border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex flex-wrap">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors md:flex-none md:px-6 ${
                isActive
                  ? "border-b-2 border-emerald-500 text-emerald-600 dark:border-emerald-400 dark:text-emerald-300"
                  : "border-b-2 border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-100"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
