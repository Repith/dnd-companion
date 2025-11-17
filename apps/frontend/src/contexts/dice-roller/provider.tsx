"use client";

import {
  createContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";

import DiceBox from "@3d-dice/dice-box";
import DisplayResults from "@3d-dice/dice-ui/src/displayResults";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext";
import { useCharacterEventBus } from "@/contexts/CharacterEventBus";

import type {
  DiceNotation,
  DiceRollMeta,
  ExportedRollResult,
  DiceBoxRollGroup,
} from "./types";

import type { DiceRollOptions } from "@/types/dice-rolls";

/* ============================================================================
 * Context + Interface
 * ========================================================================== */
interface DiceRollerContextValue {
  isReady: boolean;
  isRolling: boolean;
  roll: (
    notations: DiceNotation[],
    meta?: DiceRollMeta,
    opts?: DiceRollOptions,
  ) => Promise<ExportedRollResult>;
  clear: () => void;
  build: () => DiceRollBuilder;
}

export const DiceRollerContext = createContext<DiceRollerContextValue | null>(
  null,
);

/* ============================================================================
 * Provider
 * ========================================================================== */
export default function DiceRollerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const boxRef = useRef<any>(null);
  const displayRef = useRef<any>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const [isReady, setIsReady] = useState(false);
  const [lastResult, setLastResult] = useState<ExportedRollResult | null>(null);

  const { user } = useAuth();
  const eventBus = useCharacterEventBus();

  /* --------------------------- INIT ------------------------------------ */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const box = new DiceBox("#dice-box", {
        assetPath: "/assets/dice-box/",
        theme: "default",
        themeColor: "#9d34c9",
        gravity: 4,
        scale: 4.5,
        delay: 7,
      });

      await box.init();
      if (cancelled) return;

      boxRef.current = box;
      displayRef.current = new DisplayResults("#dice-box");
      setIsReady(true);
    })();

    return () => {
      cancelled = true;
      hideTimeoutRef.current && clearTimeout(hideTimeoutRef.current);
      boxRef.current?.clear?.();
      displayRef.current?.clear?.();
      boxRef.current = null;
      displayRef.current = null;
    };
  }, []);

  /* --------------------------- AUTO HIDE ------------------------------- */
  const scheduleHide = useCallback(() => {
    hideTimeoutRef.current && clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      boxRef.current?.hide?.();
      displayRef.current?.clear?.();
      setLastResult(null);
    }, 3000);
  }, []);

  /* ---------------------------- ROLL ----------------------------------- */
  const roll = useCallback(
    async (
      notations: DiceNotation[],
      meta: DiceRollMeta = {},
      opts: DiceRollOptions = {},
    ): Promise<ExportedRollResult> => {
      const box = boxRef.current;
      const display = displayRef.current;

      if (!box) throw new Error("DiceBox not initialized");

      /* Ensure we always have valid notations */
      if (!notations || notations.length === 0) {
        notations = ["1d20"];
      }

      setIsRolling(true);

      try {
        /* Clear hide timeout */
        hideTimeoutRef.current && clearTimeout(hideTimeoutRef.current);
        box.show();

        /* Roll raw dice */
        const arg = notations.length === 1 ? notations[0] : notations;
        const results = await box.roll(arg);

        display?.clear?.();

        /* Extract roll values safely */
        const rawRolls = results.flatMap((r: DiceBoxRollGroup) => r.value);

        if (rawRolls.length === 0) {
          console.warn("DiceBox returned no rolls. Fallback to 1.");
          rawRolls.push(1);
        }

        /* Select die for adv/dis */
        let selected = rawRolls[0];
        if (opts.advantage) selected = Math.max(...rawRolls);
        if (opts.disadvantage) selected = Math.min(...rawRolls);

        /* Apply modifiers */
        const mods = opts.modifiers ?? [];
        const modSum = mods.reduce((a, b) => a + b, 0);
        const total = selected + modSum;

        /* Build expression */
        let expression = `${selected}`;
        if (mods.length > 0)
          expression +=
            " " + mods.map((n) => (n >= 0 ? `+ ${n}` : `${n}`)).join(" ");
        expression += ` = ${total}`;

        /* Build exported result */
        const exported: ExportedRollResult = {
          id: meta.id ?? `roll-${Date.now()}`,
          label: meta.label ?? "",
          notations,
          total,
          individualResults: rawRolls,
          expression,
          createdAt: new Date().toISOString(),
        };

        setLastResult(exported);
        scheduleHide();

        /* Publish event if logged-in user exists */
        if (user) eventBus.publishDiceRoll(exported);

        return exported;
      } finally {
        setIsRolling(false);
      }
    },
    [scheduleHide, user, eventBus],
  );

  /* ----------------------------- CLEAR --------------------------------- */
  const clear = useCallback(() => {
    hideTimeoutRef.current && clearTimeout(hideTimeoutRef.current);
    boxRef.current?.hide?.();
    boxRef.current?.clear?.();
    displayRef.current?.clear?.();
    setLastResult(null);
  }, []);

  /* ------------------------- CONTEXT VALUE ----------------------------- */
  const value: DiceRollerContextValue = {
    isReady,
    isRolling,
    roll,
    clear,
    build: () => new DiceRollBuilder(roll),
  };

  return (
    <DiceRollerContext.Provider value={value}>
      {children}

      {/* Dice Canvas */}
      <div
        id="dice-box"
        className="fixed inset-0 pointer-events-none z-[9999]"
      />

      {/* Roll Overlay */}
      <AnimatePresence>
        {lastResult && <DiceResultOverlay result={lastResult} />}
      </AnimatePresence>
    </DiceRollerContext.Provider>
  );
}

/* ============================================================================
 * DiceBuilder (NO MUTATION BUGS)
 * ========================================================================== */
class DiceRollBuilder {
  private _notations: DiceNotation[] = [];
  private _meta: DiceRollMeta = {};
  private _opts: DiceRollOptions = { modifiers: [] };

  constructor(private submit: DiceRollerContextValue["roll"]) {}

  private clone() {
    const b = new DiceRollBuilder(this.submit);
    b._notations = [...this._notations];
    b._meta = { ...this._meta };
    b._opts = {
      ...this._opts,
      modifiers: [...(this._opts.modifiers ?? [])],
    };
    return b;
  }

  /* Base dice */
  d20() {
    const b = this.clone();
    b._notations = ["1d20"];
    return b;
  }

  advantage(mod?: number) {
    const b = this.clone();
    b._notations = ["1d20", "1d20"];
    b._opts.advantage = true;
    if (mod) b._opts.modifiers!.push(mod);
    return b;
  }

  disadvantage(mod?: number) {
    const b = this.clone();
    b._notations = ["1d20", "1d20"];
    b._opts.disadvantage = true;
    if (mod) b._opts.modifiers!.push(mod);
    return b;
  }

  modifier(value: number) {
    const b = this.clone();
    b._opts.modifiers!.push(value);
    return b;
  }

  attackRoll(mod: number) {
    return this.d20().modifier(mod).label("Attack Roll");
  }

  damage(notation: string, mod?: number) {
    const b = this.clone();
    b._notations = [notation];
    if (mod) b._opts.modifiers!.push(mod);
    b._meta.label = "Damage Roll";
    return b;
  }

  heal(notation: string, mod?: number) {
    const b = this.clone();
    b._notations = [notation];
    if (mod) b._opts.modifiers!.push(mod);
    b._meta.label = "Healing Roll";
    return b;
  }

  savingThrow(mod: number) {
    return this.d20().modifier(mod).label("Saving Throw");
  }

  skillCheck(name: string, mod: number) {
    return this.d20().modifier(mod).label(`${name} Check`);
  }

  custom(notation: string) {
    const b = this.clone();
    b._notations = [notation];
    return b;
  }

  label(text: string) {
    const b = this.clone();
    b._meta.label = text;
    return b;
  }

  async roll() {
    return await this.submit(this._notations, this._meta, this._opts);
  }
}

/* ============================================================================
 * Result Overlay
 * ========================================================================== */
function DiceResultOverlay({ result }: { result: ExportedRollResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-[10000]"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 10, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="px-5 py-3 font-mono text-2xl text-center text-white border shadow-lg rounded-xl bg-slate-900/90 border-purple-600/40 backdrop-blur-md"
        style={{
          boxShadow:
            "0 0 25px rgba(157,52,201,0.35), 0 0 60px rgba(157,52,201,0.25)",
        }}
      >
        {result.label && (
          <div className="mb-1 text-sm text-center text-purple-300">
            {result.label}
          </div>
        )}
        {result.expression}
      </motion.div>
    </motion.div>
  );
}
