import { CharacterResponseDto } from "@/types/character";

interface CurrencyCardProps {
  currency: CharacterResponseDto["currency"];
}

export const CurrencyCard: React.FC<CurrencyCardProps> = ({ currency }) => {
  return (
    <section className="p-5 border shadow-sm rounded-2xl border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-900/80">
      <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-300">
        Currency
      </h2>

      <div className="grid grid-cols-2 gap-3 text-sm text-center">
        <CoinCard label="Gold" value={currency.gp} variant="gold" />
        <CoinCard label="Silver" value={currency.sp} variant="silver" />
        <CoinCard label="Electrum" value={currency.ep} variant="electrum" />
        <CoinCard label="Copper" value={currency.cp} variant="copper" />
        <div className="col-span-2">
          <CoinCard label="Platinum" value={currency.pp} variant="platinum" />
        </div>
      </div>
    </section>
  );
};

type CoinVariant = "gold" | "silver" | "electrum" | "copper" | "platinum";

interface CoinCardProps {
  label: string;
  value: number;
  variant: CoinVariant;
}

const variantClasses: Record<CoinVariant, string> = {
  gold: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  silver: "bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-100",
  electrum:
    "bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  copper: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  platinum:
    "bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

const CoinCard: React.FC<CoinCardProps> = ({ label, value, variant }) => (
  <div
    className={`rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 ${variantClasses[variant]}`}
  >
    <div className="text-xl font-bold">{value}</div>
    <div className="text-xs tracking-wide uppercase">{label}</div>
  </div>
);
