"use client";

import {
  DiceNotation,
  ExportedRollResult,
  useDiceRoller,
} from "@/contexts/dice-roller";
import { useState } from "react";

const DICE_TYPES: { label: string; notation: DiceNotation }[] = [
  { label: "d20", notation: "1d20" },
  { label: "d12", notation: "1d12" },
  { label: "d10", notation: "1d10" },
  { label: "d8", notation: "1d8" },
  { label: "d6", notation: "1d6" },
  { label: "d4", notation: "1d4" },
];

interface DiceRadialMenuProps {
  onRollResolved?: (result: ExportedRollResult) => void;
  characterId?: string;
}

export function DiceRadialMenu({
  onRollResolved,
  characterId,
}: DiceRadialMenuProps) {
  const { isReady, roll } = useDiceRoller();

  const [isOpen, setIsOpen] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState<ExportedRollResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleToggleMenu = () => {
    if (!isOpen) setShowHistory(false);
    setIsOpen((prev) => !prev);
  };

  const handleRollClick = async (notation: DiceNotation) => {
    if (!isReady) return;

    setIsOpen(false);
    setIsRolling(true);

    try {
      const result = await roll(
        [notation],
        { label: String(notation) },
        characterId,
      );
      setHistory((prev) => [result, ...prev].slice(0, 3));
      setShowHistory(true);

      onRollResolved?.(result);
    } catch (err) {
      console.error("Dice roll failed", err);
    } finally {
      setIsRolling(false);
    }
  };

  /** TRUE HEX DIMENSIONS */
  const HEX_W = 60; // w-20 = 80px
  const HEX_H = 80; // h-20 = 80px

  /** PERFECT HEX GRID OFFSETS (FLAT-TOP HEXES) */
  const dx = HEX_W; // 60px
  const dy = HEX_H; // 69.28px

  const positions = [
    { x: 0, y: -dy }, // top
    { x: dx, y: -dy / 2 }, // top-right
    { x: dx, y: dy / 2 }, // bottom-right
    { x: 0, y: dy }, // bottom
    { x: -dx, y: dy / 2 }, // bottom-left
    { x: -dx, y: -dy / 2 }, // top-left
  ];

  /** HEX SHAPE */
  const hex = {
    clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
  } as const;

  return (
    <div className="fixed select-none bottom-20 right-20 z-12000">
      {/* === HEX GRID MENU === */}
      <div className="relative w-20 h-20">
        {DICE_TYPES.map((die, index) => {
          const { x, y } = positions[index];
          const delay = `${index * 40}ms`;

          return (
            <button
              key={die.label}
              onClick={() => handleRollClick(die.notation)}
              disabled={!isOpen}
              className={`
                absolute flex h-20 w-20 items-center justify-center
                font-bold text-lg text-white cursor-pointer

                bg-gradient-to-br from-slate-800 to-slate-700
                shadow-md

                hover:bg-gradient-to-br hover:from-purple-600 hover:to-purple-800
                hover:shadow-lg

                transition-all duration-200 ease-out

                ${
                  isOpen
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-50 pointer-events-none"
                }
              `}
              style={{
                ...hex,
                top: "50%",
                left: "50%",
                transitionDelay: delay,
                transform: isOpen
                  ? `translate(-50%, -50%) translate(${x}px, ${y}px)`
                  : `translate(-50%, -50%)`,
              }}
            >
              {die.label}
            </button>
          );
        })}

        {/* === CENTER BUTTON === */}
        <button
          onClick={handleToggleMenu}
          className={`
            absolute inset-0 flex items-center justify-center
            font-extrabold text-3xl text-white
            bg-gradient-to-br from-purple-500 to-purple-700
            shadow-xl cursor-pointer

            hover:shadow-2xl hover:scale-105
            transition-all duration-200
          `}
          style={hex}
        >
          {isRolling ? (
            <div className="w-6 h-6 border-2 border-white rounded-full animate-spin border-t-transparent" />
          ) : (
            "🎲"
          )}
        </button>
      </div>

      {/* === LAST ROLLS POPUP === */}
      {showHistory && history.length > 0 && (
        <div className="absolute bottom-0 left-1/2 translate-x-[-50%] mb-22 p-3 border shadow-xl bg-slate-800/90 border-slate-500/50 rounded-xl backdrop-blur-md">
          <div className="mb-2 text-xs tracking-wide text-center uppercase text-slate-300">
            Last Rolls
          </div>

          <div className="flex gap-2 font-mono text-sm text-white">
            {history.map((r, i) => (
              <div
                key={i}
                className="flex flex-col items-center px-3 py-2 border rounded bg-slate-900/40 border-slate-600/40"
              >
                <span className="text-xl font-bold">{r.total}</span>
                <span className="text-xs text-slate-400">{r.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
