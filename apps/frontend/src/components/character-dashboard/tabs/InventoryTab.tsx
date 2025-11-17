// tabs/InventoryTab.tsx
import React from "react";
import type { CharacterResponseDto } from "@/types/character";

interface InventoryTabProps {
  character: CharacterResponseDto;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({ character }) => {
  return (
    <div className="p-6 bg-white border rounded-lg">
      <h3 className="mb-4 text-lg font-semibold">Inventory Management</h3>
      <p className="text-gray-600">
        Inventory system with enhanced management coming soon.
      </p>

      {character.currency && (
        <div className="grid grid-cols-5 gap-4 mt-6">
          <div className="p-3 rounded bg-gray-50">
            <div className="font-bold">{character.currency.cp}</div>
            <div className="text-sm text-gray-600">CP</div>
          </div>
          <div className="p-3 rounded bg-gray-50">
            <div className="font-bold">{character.currency.sp}</div>
            <div className="text-sm text-gray-600">SP</div>
          </div>
          <div className="p-3 rounded bg-gray-50">
            <div className="font-bold">{character.currency.ep}</div>
            <div className="text-sm text-gray-600">EP</div>
          </div>
          <div className="p-3 rounded bg-gray-50">
            <div className="font-bold">{character.currency.gp}</div>
            <div className="text-sm text-gray-600">GP</div>
          </div>
          <div className="p-3 rounded bg-gray-50">
            <div className="font-bold">{character.currency.pp}</div>
            <div className="text-sm text-gray-600">PP</div>
          </div>
        </div>
      )}
    </div>
  );
};
