"use client";

import { useCharacter } from "@/contexts/CharacterContext";
import InventoryDisplay from "@/components/InventoryDisplay";

export default function InventoryPage() {
  const { selectedCharacter } = useCharacter();

  if (selectedCharacter) {
    return <InventoryDisplay characterId={selectedCharacter.id} />;
  } else {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-semibold text-amber-900 dark:text-amber-100">
            Inventory Module
          </h2>
          <p className="text-amber-700 dark:text-amber-300">
            Please select a character from the Characters module first.
          </p>
        </div>
      </div>
    );
  }
}
