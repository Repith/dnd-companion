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
