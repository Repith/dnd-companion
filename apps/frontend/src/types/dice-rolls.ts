import { DiceNotation } from "@/contexts/dice-roller";

export interface ExportedRollResult {
  id: string;
  label?: string;
  notations: DiceNotation[];
  total: number;
  individualResults: number[];
  createdAt: string;
  expression: string;
}

export interface AttackRollResult {
  attack: ExportedRollResult;
  damage?: ExportedRollResult | null;
}

export interface DiceRollOptions {
  advantage?: boolean;
  disadvantage?: boolean;
  modifiers?: number[];
  type?: "attack" | "damage" | "heal" | "check" | "saving-throw" | "custom";
  context?: string;
}
