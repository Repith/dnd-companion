"use client";

import { useContext } from "react";
import { DiceRollerContext } from "./provider";

export function useDice() {
  const ctx = useContext(DiceRollerContext);
  if (!ctx) throw new Error("useDice must be used inside <DiceRollerProvider>");

  return {
    build: ctx.build,
    isRolling: ctx.isRolling,
  };
}

export function useDiceRoller() {
  const ctx = useContext(DiceRollerContext);
  if (!ctx)
    throw new Error("useDiceRoller must be used inside <DiceRollerProvider>");
  return ctx;
}
