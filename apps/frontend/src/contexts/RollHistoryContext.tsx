"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DiceRollResponseDto } from "@/types/character";
import { diceRollApi } from "@/lib/api/dice-roll";

interface RollHistoryContextType {
  useRolls: (characterId: string) => {
    data: DiceRollResponseDto[] | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
  useAllRolls: () => {
    data: DiceRollResponseDto[] | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
  invalidateRolls: (characterId?: string) => void;
}

const RollHistoryContext = createContext<RollHistoryContextType | undefined>(
  undefined,
);

export function RollHistoryProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const useRolls = (characterId: string) => {
    return useQuery({
      queryKey: ["dice-rolls", characterId],
      queryFn: () => diceRollApi.getAll(characterId, 3),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  const useAllRolls = () => {
    return useQuery({
      queryKey: ["dice-rolls"],
      queryFn: () => diceRollApi.getAll(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  const invalidateRolls = (characterId?: string) => {
    console.log("DEBUG: invalidateRolls called with characterId:", characterId);
    if (characterId) {
      console.log("DEBUG: Invalidating query", ["dice-rolls", characterId]);
      queryClient.invalidateQueries({ queryKey: ["dice-rolls", characterId] });
    } else {
      console.log("DEBUG: Invalidating all dice-rolls queries");
      queryClient.invalidateQueries({ queryKey: ["dice-rolls"] });
    }
  };

  const value: RollHistoryContextType = {
    useRolls,
    useAllRolls,
    invalidateRolls,
  };

  return (
    <RollHistoryContext.Provider value={value}>
      {children}
    </RollHistoryContext.Provider>
  );
}

export function useRollHistory() {
  const context = useContext(RollHistoryContext);
  if (context === undefined) {
    throw new Error("useRollHistory must be used within a RollHistoryProvider");
  }
  return context;
}
