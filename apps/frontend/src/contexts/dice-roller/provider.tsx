"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";

import DisplayResults from "@3d-dice/dice-ui/src/displayResults";
import DiceBox from "@3d-dice/dice-box";

import { useAuth } from "@/contexts/AuthContext";
import { diceRollApi } from "@/lib/api/dice-roll";
import { useRollHistory } from "@/contexts/RollHistoryContext";

import type {
  DiceTheme,
  DiceNotation,
  DiceBoxRollResults,
  DiceRollMeta,
  ExportedRollResult,
} from "./types";

interface DiceRollerContextValue {
  isReady: boolean;
  theme: DiceTheme;
  themeColor: string;
  lastExportedRoll: ExportedRollResult | null;

  roll: (
    notations: DiceNotation[],
    meta?: DiceRollMeta,
    characterId?: string,
  ) => Promise<ExportedRollResult>;

  clear: () => void;

  setTheme: (theme: DiceTheme) => void;
  setThemeColor: (hex: string) => void;
}

export const DiceRollerContext = createContext<DiceRollerContextValue | null>(
  null,
);

const AUTO_HIDE_MS = 3000;

export default function DiceRollerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const diceBoxRef = useRef<any | null>(null);
  const displayRef = useRef<any | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [theme, setThemeState] = useState<DiceTheme>("default");
  const [themeColor, setThemeColorState] = useState<string>("#9d34c9");
  const [isReady, setIsReady] = useState(false);
  const [lastExportedRoll, setLastExportedRoll] =
    useState<ExportedRollResult | null>(null);

  const { user } = useAuth();
  const { invalidateRolls } = useRollHistory();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const box = new DiceBox("#dice-box", {
          assetPath: "/assets/dice-box/",
          theme,
          themeColor,
          scale: 5,
          gravity: 3,
          delay: 5,
        });

        await box.init();
        if (cancelled) {
          box.clear();
          return;
        }

        const display = new DisplayResults("#dice-box");

        diceBoxRef.current = box;
        displayRef.current = display;

        setIsReady(true);
      } catch (error) {
        console.error("DiceBox init failed:", error);
      }
    })();

    return () => {
      cancelled = true;

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      diceBoxRef.current?.clear();
      diceBoxRef.current?.hide?.();
      diceBoxRef.current = null;

      displayRef.current?.clear();
      displayRef.current = null;

      setIsReady(false);
      setLastExportedRoll(null);
    };
  }, []);

  /* ---------------------- Auto-hide ----------------- */

  const scheduleHide = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    const box = diceBoxRef.current;
    const display = displayRef.current;

    hideTimeoutRef.current = setTimeout(() => {
      box?.hide?.();
      display?.clear();
      setLastExportedRoll(null);
    }, AUTO_HIDE_MS);
  }, []);

  /* --------------------------- roll() ------------------------------ */

  const roll = useCallback(
    async (
      notations: DiceNotation[],
      meta?: DiceRollMeta,
      characterId?: string,
    ): Promise<ExportedRollResult> => {
      const box = diceBoxRef.current;
      const display = displayRef.current;

      if (!box) throw new Error("DiceBox nie jest jeszcze zainicjalizowany");
      if (!notations || notations.length === 0) {
        throw new Error("Musisz podać przynajmniej jedną notację rzutu");
      }

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      const notationArg =
        notations.length === 1 ? (notations[0] as any) : (notations as any);

      box.show();

      const results: DiceBoxRollResults = await box.roll(notationArg);

      // Nadal czyścimy / przygotowujemy DisplayResults (np. na przyszłość),
      // ale nie polegamy na jego tekście.
      display?.clear?.();

      const individualResults = results.flatMap((group) =>
        (group.rolls ?? []).map((r) => r.value),
      );

      const total = results.reduce((sum, group) => sum + (group.value ?? 0), 0);

      const expressionBase = individualResults.length
        ? individualResults.join(" + ")
        : String(total);

      const exported: ExportedRollResult = {
        id: meta?.id ?? `dice-roll-${Date.now()}`,
        label: meta?.label ?? "",
        notations,
        total,
        individualResults,
        createdAt: new Date().toISOString(),
        expression: `${expressionBase} = ${total}`,
      };

      setLastExportedRoll(exported);
      scheduleHide();

      // If characterId is provided and user is authenticated, save to backend and history
      if (characterId && user) {
        console.log("DEBUG: Attempting to save dice roll", {
          characterId,
          userId: user.id,
          total,
        });
        try {
          const diceType = notations
            .map((n) =>
              typeof n === "string"
                ? n
                : `${n.qty ?? 1}d${n.sides}${
                    n.modifier ? `+${n.modifier}` : ""
                  }`,
            )
            .join(" + ");

          const numberOfDice = individualResults.length;

          const rollData = {
            diceType,
            numberOfDice,
            individualResults,
            totalResult: total,
            characterId,
          };

          console.log("DEBUG: Calling diceRollApi.create with", rollData);
          const savedRoll = await diceRollApi.create(rollData);
          console.log("DEBUG: Saved roll successfully", savedRoll);
          console.log("DEBUG: Calling invalidateRolls for", characterId);
          invalidateRolls(characterId);
        } catch (error) {
          console.error("Failed to save dice roll:", error);
          // Don't throw error to avoid breaking the roll functionality
        }
      } else {
        console.log(
          "DEBUG: Skipping save - characterId:",
          characterId,
          "user:",
          !!user,
        );
      }

      return exported;
    },
    [scheduleHide, user, invalidateRolls],
  );

  /* --------------------------- clear() ----------------------------- */

  const clear = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    diceBoxRef.current?.clear();
    diceBoxRef.current?.hide?.();
    displayRef.current?.clear();
    setLastExportedRoll(null);
  }, []);

  /* ---------------------- Zmiana theme / koloru -------------------- */

  const setTheme = useCallback((nextTheme: DiceTheme) => {
    setThemeState(nextTheme);
    const box = diceBoxRef.current;
    if (box) {
      box.updateConfig({ theme: nextTheme });
    }
  }, []);

  const setThemeColor = useCallback((hex: string) => {
    setThemeColorState(hex);
    const box = diceBoxRef.current;
    if (box) {
      box.updateConfig({ themeColor: hex });
    }
  }, []);

  const value: DiceRollerContextValue = {
    isReady,
    theme,
    themeColor,
    lastExportedRoll,
    roll,
    clear,
    setTheme,
    setThemeColor,
  };

  return (
    <DiceRollerContext.Provider value={value}>
      {children}

      <div id="dice-box" className="fixed inset-0 pointer-events-none z-9999" />

      {lastExportedRoll && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-10000">
          <div className="px-4 py-3 text-xl font-bold border shadow-2xl rounded-xl bg-slate-900/90 text-slate-50 border-slate-600">
            <span className="font-mono">{lastExportedRoll.expression}</span>
          </div>
        </div>
      )}
    </DiceRollerContext.Provider>
  );
}
