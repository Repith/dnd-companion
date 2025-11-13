export type DiceTheme = "default" | "rock" | "rust";

export interface DiceBoxRollObject {
  modifier?: number;
  qty?: number;
  sides: number | string;
  theme?: DiceTheme;
  themeColor?: string | null;
}

export type DiceNotation = string | DiceBoxRollObject;

export interface DiceBoxDieResult {
  groupId: number;
  rollId: number | string;
  sides: number;
  theme: string;
  themeColor?: string | null;
  value: number;
}

export interface DiceBoxRollGroup {
  id: number;
  groupId?: number;
  mods: any[];
  qty: number;
  rolls: DiceBoxDieResult[];
  sides: number;
  theme: string;
  themeColor?: string | null;
  value: number;
}

export type DiceBoxRollResults = DiceBoxRollGroup[];

export interface DiceRollMeta {
  id?: string;
  label?: string;
}

export interface ExportedRollResult {
  id: string;
  label?: string;
  notations: DiceNotation[];
  total: number;
  individualResults: number[];
  createdAt: string;
  expression: string;
}
