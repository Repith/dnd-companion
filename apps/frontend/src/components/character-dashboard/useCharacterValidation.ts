"use client";

import { useEffect, useRef } from "react";
import type { CharacterResponseDto } from "@/types/character";
import { validateCharacterData } from "@/contexts/CharacterEventBus";
import type { CharacterDashboardState } from "./CharacterDashboard.types";

type SetDashboardState = React.Dispatch<
  React.SetStateAction<CharacterDashboardState>
>;

export function useCharacterValidation(
  character: CharacterResponseDto,
  editMode: boolean,
  setState: SetDashboardState,
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!editMode) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setState((prev) => ({ ...prev, isValidating: true }));

    timeoutRef.current = setTimeout(() => {
      const validation = validateCharacterData(character);
      setState((prev) => ({
        ...prev,
        isValidating: false,
        validationErrors: validation.errors,
        validationWarnings: validation.warnings ?? [],
      }));
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [character, editMode, setState]);
}
