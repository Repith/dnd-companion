"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { CharacterResponseDto } from "@/types/character";

interface CharacterContextType {
  selectedCharacter: CharacterResponseDto | null;
  setSelectedCharacter: (character: CharacterResponseDto | null) => void;
}

const CharacterContext = createContext<CharacterContextType | undefined>(
  undefined,
);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterResponseDto | null>(null);

  return (
    <CharacterContext.Provider
      value={{ selectedCharacter, setSelectedCharacter }}
    >
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter() {
  const context = useContext(CharacterContext);
  if (context === undefined) {
    throw new Error("useCharacter must be used within a CharacterProvider");
  }
  return context;
}
