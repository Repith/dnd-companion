import React from "react";
import type { CharacterResponseDto } from "@/types/character";
import { Features } from "@/components/Features";

interface FeaturesTabProps {
  character: CharacterResponseDto;
  onFeaturesUpdate: (character: CharacterResponseDto) => void;
}

export const FeaturesTab: React.FC<FeaturesTabProps> = ({
  character,
  onFeaturesUpdate,
}) => <Features character={character} onCharacterUpdate={onFeaturesUpdate} />;
