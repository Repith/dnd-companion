// tabs/RollsTab.tsx
import RollHistory from "@/components/RollHistory";
import React from "react";

interface RollsTabProps {
  characterId: string;
}

export const RollsTab: React.FC<RollsTabProps> = ({ characterId }) => (
  <RollHistory characterId={characterId} />
);
