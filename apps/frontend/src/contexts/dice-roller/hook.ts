import { useContext } from "react";
import { DiceRollerContext } from "./provider";

export function useDiceRoller() {
  const ctx = useContext(DiceRollerContext);
  if (!ctx) {
    throw new Error(
      "useDiceRoller musi być użyty wewnątrz <DiceRollerProvider>",
    );
  }
  return ctx;
}
