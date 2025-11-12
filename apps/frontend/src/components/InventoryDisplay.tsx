"use client";

import { useState, useEffect } from "react";
import {
  InventoryResponseDto,
  InventoryItemResponseDto,
} from "@/types/inventory";
import { inventoryApi } from "@/lib/api/inventory";

interface InventoryDisplayProps {
  characterId: string;
  onItemSelect?: (item: InventoryItemResponseDto) => void;
  onItemEquip?: (itemId: string, equipped: boolean) => void;
  onInventoryLoad?: (inventory: InventoryResponseDto) => void;
}

export default function InventoryDisplay({
  characterId,
  onItemSelect,
  onItemEquip,
  onInventoryLoad,
}: InventoryDisplayProps) {
  const handleItemSelect = onItemSelect || (() => {});
  const [inventory, setInventory] = useState<InventoryResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInventory();
  }, [characterId]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getCharacterInventory(characterId);
      setInventory(data);
      onInventoryLoad?.(data);
    } catch (err) {
      setError("Failed to load inventory");
      console.error("Error loading inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEquipToggle = async (
    itemId: string,
    currentlyEquipped: boolean,
  ) => {
    if (!inventory) return;

    try {
      const updatedInventory = await inventoryApi.equipItem(
        inventory.id,
        itemId,
        { equipped: !currentlyEquipped },
      );
      setInventory(updatedInventory);
      onItemEquip?.(itemId, !currentlyEquipped);
    } catch (err) {
      console.error("Error toggling equipment:", err);
      alert("Failed to equip/unequip item");
    }
  };

  const handleRemoveItem = async (itemId: string, itemName: string) => {
    if (!inventory) return;

    if (!confirm(`Remove ${itemName} from inventory?`)) return;

    try {
      const updatedInventory = await inventoryApi.removeItem(
        inventory.id,
        itemId,
      );
      setInventory(updatedInventory);
    } catch (err) {
      console.error("Error removing item:", err);
      alert("Failed to remove item");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">Loading inventory...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <div className="mb-4 text-red-600">{error}</div>
        <button
          onClick={loadInventory}
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!inventory || inventory.items.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="mb-4 text-gray-500">No items in inventory</div>
      </div>
    );
  }

  const equippedItems = inventory.items.filter((item) => item.equipped);
  const unequippedItems = inventory.items.filter((item) => !item.equipped);

  return (
    <div className="space-y-6">
      {/* Encumbrance Status */}
      {inventory.encumbrance && (
        <div
          className="p-4 rounded-lg bg-gray-50"
          role="region"
          aria-labelledby="encumbrance-heading"
        >
          <div className="flex items-center justify-between mb-2">
            <h3
              id="encumbrance-heading"
              className="font-semibold text-gray-900"
            >
              Encumbrance
            </h3>
            <span
              className={`px-2 py-1 text-xs font-medium rounded ${
                inventory.encumbrance.isEncumbered
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              }`}
              role="status"
              aria-label={`Encumbrance status: ${
                inventory.encumbrance.isEncumbered ? "Encumbered" : "Normal"
              }`}
            >
              {inventory.encumbrance.isEncumbered ? "Encumbered" : "Normal"}
            </span>
          </div>
          <div
            className="w-full h-2 bg-gray-200 rounded-full"
            role="progressbar"
            aria-valuenow={inventory.encumbrance.currentWeight}
            aria-valuemax={inventory.encumbrance.maxWeight}
            aria-label={`Weight: ${inventory.encumbrance.currentWeight} out of ${inventory.encumbrance.maxWeight} pounds`}
          >
            <div
              className={`h-2 rounded-full ${
                inventory.encumbrance.isEncumbered
                  ? "bg-red-600"
                  : "bg-blue-600"
              }`}
              style={{
                width: `${Math.min(
                  (inventory.encumbrance.currentWeight /
                    inventory.encumbrance.maxWeight) *
                    100,
                  100,
                )}%`,
              }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-sm text-gray-600">
            <span aria-label="Current weight">
              {inventory.encumbrance.currentWeight} lbs
            </span>
            <span aria-label="Maximum weight">
              {inventory.encumbrance.maxWeight} lbs max
            </span>
          </div>
        </div>
      )}

      {/* Equipped Items */}
      {equippedItems.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">
            Equipped Items
          </h3>
          <div className="space-y-2">
            {equippedItems.map((item) => (
              <InventoryItemCard
                key={item.id}
                item={item}
                onSelect={handleItemSelect}
                onEquipToggle={handleEquipToggle}
                onRemove={handleRemoveItem}
                showEquipButton={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Unequipped Items */}
      {unequippedItems.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">
            Inventory Items
          </h3>
          <div className="space-y-2">
            {unequippedItems.map((item) => (
              <InventoryItemCard
                key={item.id}
                item={item}
                onSelect={handleItemSelect}
                onEquipToggle={handleEquipToggle}
                onRemove={handleRemoveItem}
                showEquipButton={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface InventoryItemCardProps {
  item: InventoryItemResponseDto;
  onSelect: (item: InventoryItemResponseDto) => void;
  onEquipToggle: (itemId: string, equipped: boolean) => void;
  onRemove: (itemId: string, itemName: string) => void;
  showEquipButton?: boolean;
}

function InventoryItemCard({
  item,
  onSelect,
  onEquipToggle,
  onRemove,
  showEquipButton = false,
}: InventoryItemCardProps) {
  return (
    <div
      className="flex items-center justify-between p-3 transition-shadow bg-white border rounded-lg shadow-sm hover:shadow-md"
      role="listitem"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h4
            className="font-medium text-gray-900 truncate"
            id={`item-${item.id}-name`}
          >
            {item.item.name}
          </h4>
          <span
            className={`px-2 py-1 text-xs font-medium rounded ${
              item.equipped
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
            role="status"
            aria-label={`Item status: ${
              item.equipped ? "Equipped" : "Unequipped"
            }`}
          >
            {item.equipped ? "Equipped" : "Unequipped"}
          </span>
        </div>
        <div className="flex items-center mt-1 space-x-4 text-sm text-gray-600">
          <span aria-label="Item type">Type: {item.item.type}</span>
          <span aria-label="Item rarity">Rarity: {item.item.rarity}</span>
          <span aria-label="Item weight">Weight: {item.item.weight} lbs</span>
          {item.quantity > 1 && (
            <span aria-label="Quantity">Qty: {item.quantity}</span>
          )}
        </div>
        {item.notes && (
          <p className="mt-1 text-sm text-gray-500" aria-label="Item notes">
            {item.notes}
          </p>
        )}
      </div>

      <div
        className="flex items-center ml-4 space-x-2"
        role="group"
        aria-label="Item actions"
      >
        {showEquipButton && (
          <button
            onClick={() => onEquipToggle(item.id, item.equipped)}
            className={`px-3 py-1 text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              item.equipped
                ? "text-orange-700 bg-orange-100 hover:bg-orange-200"
                : "text-green-700 bg-green-100 hover:bg-green-200"
            }`}
            aria-label={`${item.equipped ? "Unequip" : "Equip"} ${
              item.item.name
            }`}
            aria-describedby={`item-${item.id}-name`}
          >
            {item.equipped ? "Unequip" : "Equip"}
          </button>
        )}

        <button
          onClick={() => onSelect(item)}
          className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={`View details for ${item.item.name}`}
          aria-describedby={`item-${item.id}-name`}
        >
          View
        </button>

        <button
          onClick={() => onRemove(item.id, item.item.name)}
          className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          aria-label={`Remove ${item.item.name} from inventory`}
          aria-describedby={`item-${item.id}-name`}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
