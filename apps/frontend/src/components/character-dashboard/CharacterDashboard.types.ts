import type { CharacterResponseDto } from "@/types/character";

export type CharacterTab =
  | "overview"
  | "spells"
  | "features"
  | "rolls"
  | "inventory"
  | "notes"
  | "comparison";

export interface CharacterDashboardState {
  hasUnsavedChanges: boolean;
  lastSavedData: Partial<CharacterResponseDto>;
  editMode: boolean;
  comparisonMode: boolean;
  comparedCharacters: string[];
  undoRedoStack: {
    undo: Array<() => Promise<void> | void>;
    redo: Array<() => Promise<void> | void>;
  };
  isValidating: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  characterStats: {
    totalUpdates: number;
    lastModified: Date | null;
    version: number;
  };
}
