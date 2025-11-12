"use client";

import { useState, useEffect } from "react";
import {
  InventoryResponseDto,
  InventoryItemResponseDto,
} from "@/types/inventory";
import { ItemResponseDto } from "@/types/item";
import { itemApi } from "@/lib/api/item";

interface StatEffectsDisplayProps {
  inventory: InventoryResponseDto;
  onItemDetails?: (item: InventoryItemResponseDto) => void;
}

interface StatBonus {
  abilityScoreModifiers: Record<string, number>;
  skillModifiers: Record<string, number>;
  savingThrowModifiers: Record<string, number>;
  armorClassBonus: number;
  otherEffects: string[];
}

export default function StatEffectsDisplay({
  inventory,
  onItemDetails,
}: StatEffectsDisplayProps) {
  const [fullItems, setFullItems] = useState<Record<string, ItemResponseDto>>(
    {},
  );
  const [loading, setLoading] = useState(false);

  const equippedItems = inventory.items.filter((item) => item.equipped);

  useEffect(() => {
    const loadFullItemDetails = async () => {
      const itemIds = equippedItems.map((item) => item.itemId);
      const uniqueIds = [...new Set(itemIds)];

      const itemsToFetch = uniqueIds.filter((id) => !fullItems[id]);

      if (itemsToFetch.length === 0) return;

      setLoading(true);
      try {
        const fetchedItems: Record<string, ItemResponseDto> = { ...fullItems };

        for (const itemId of itemsToFetch) {
          try {
            const item = await itemApi.getById(itemId);
            fetchedItems[itemId] = item;
          } catch (error) {
            console.error(`Failed to fetch item ${itemId}:`, error);
          }
        }

        setFullItems(fetchedItems);
      } catch (error) {
        console.error("Error loading item details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (equippedItems.length > 0) {
      loadFullItemDetails();
    }
  }, [equippedItems.map((item) => item.itemId).join(",")]);

  // Calculate total bonuses from equipped items
  const calculateBonuses = (): StatBonus => {
    const bonuses: StatBonus = {
      abilityScoreModifiers: {},
      skillModifiers: {},
      savingThrowModifiers: {},
      armorClassBonus: 0,
      otherEffects: [],
    };

    equippedItems.forEach((item) => {
      const fullItem = fullItems[item.itemId];
      if (!fullItem) return;

      if (fullItem.effects) {
        const effects = fullItem.effects;

        // Ability score modifiers
        if (effects.abilityScoreModifiers) {
          Object.entries(effects.abilityScoreModifiers).forEach(
            ([ability, bonus]) => {
              bonuses.abilityScoreModifiers[ability] =
                (bonuses.abilityScoreModifiers[ability] || 0) +
                (bonus as number);
            },
          );
        }

        // Skill modifiers
        if (effects.skillModifiers) {
          Object.entries(effects.skillModifiers).forEach(([skill, bonus]) => {
            bonuses.skillModifiers[skill] =
              (bonuses.skillModifiers[skill] || 0) + (bonus as number);
          });
        }

        // Saving throw modifiers
        if (effects.savingThrowModifiers) {
          Object.entries(effects.savingThrowModifiers).forEach(
            ([save, bonus]) => {
              bonuses.savingThrowModifiers[save] =
                (bonuses.savingThrowModifiers[save] || 0) + (bonus as number);
            },
          );
        }
      }

      // Armor class bonus from properties
      if (fullItem.properties?.armorClassBonus) {
        bonuses.armorClassBonus += fullItem.properties.armorClassBonus;
      }

      // Other effects (attunement, charges, etc.)
      const otherEffects: string[] = [];
      if (fullItem.properties?.attunement) {
        otherEffects.push("Requires Attunement");
      }
      if (fullItem.properties?.charges) {
        otherEffects.push(
          `${fullItem.properties.charges}/${
            fullItem.properties.maxCharges || "∞"
          } charges`,
        );
      }
      if (otherEffects.length > 0) {
        bonuses.otherEffects.push(
          `${fullItem.name}: ${otherEffects.join(", ")}`,
        );
      }
    });

    return bonuses;
  };

  const bonuses = calculateBonuses();

  const hasAnyBonuses = () => {
    return (
      Object.keys(bonuses.abilityScoreModifiers).length > 0 ||
      Object.keys(bonuses.skillModifiers).length > 0 ||
      Object.keys(bonuses.savingThrowModifiers).length > 0 ||
      bonuses.armorClassBonus > 0 ||
      bonuses.otherEffects.length > 0
    );
  };

  if (equippedItems.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 rounded-lg bg-gray-50">
        No equipped items
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500 rounded-lg bg-gray-50">
        Loading item effects...
      </div>
    );
  }

  if (!hasAnyBonuses()) {
    return (
      <div className="p-4 text-center text-gray-500 rounded-lg bg-gray-50">
        Equipped items provide no stat bonuses
      </div>
    );
  }

  return (
    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
      <h3 className="mb-3 text-lg font-semibold text-blue-900">
        Stat Effects from Equipment
      </h3>

      <div className="space-y-4">
        {/* Ability Score Modifiers */}
        {Object.keys(bonuses.abilityScoreModifiers).length > 0 && (
          <div>
            <h4 className="mb-2 font-medium text-blue-800">
              Ability Score Bonuses
            </h4>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {Object.entries(bonuses.abilityScoreModifiers).map(
                ([ability, bonus]) => (
                  <div
                    key={ability}
                    className="flex justify-between p-2 bg-white border rounded"
                  >
                    <span className="text-sm font-medium capitalize">
                      {ability.toLowerCase()}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        bonus >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {bonus >= 0 ? "+" : ""}
                      {bonus}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {/* Skill Modifiers */}
        {Object.keys(bonuses.skillModifiers).length > 0 && (
          <div>
            <h4 className="mb-2 font-medium text-blue-800">Skill Bonuses</h4>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {Object.entries(bonuses.skillModifiers).map(([skill, bonus]) => (
                <div
                  key={skill}
                  className="flex justify-between p-2 bg-white border rounded"
                >
                  <span className="text-sm font-medium">
                    {skill
                      .replace("_", " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      bonus >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {bonus >= 0 ? "+" : ""}
                    {bonus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saving Throw Modifiers */}
        {Object.keys(bonuses.savingThrowModifiers).length > 0 && (
          <div>
            <h4 className="mb-2 font-medium text-blue-800">
              Saving Throw Bonuses
            </h4>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {Object.entries(bonuses.savingThrowModifiers).map(
                ([save, bonus]) => (
                  <div
                    key={save}
                    className="flex justify-between p-2 bg-white border rounded"
                  >
                    <span className="text-sm font-medium capitalize">
                      {save.toLowerCase()}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        bonus >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {bonus >= 0 ? "+" : ""}
                      {bonus}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {/* Armor Class Bonus */}
        {bonuses.armorClassBonus > 0 && (
          <div>
            <h4 className="mb-2 font-medium text-blue-800">
              Armor Class Bonus
            </h4>
            <div className="p-2 bg-white border rounded">
              <span className="text-sm font-bold text-green-600">
                +{bonuses.armorClassBonus} AC
              </span>
            </div>
          </div>
        )}

        {/* Other Effects */}
        {bonuses.otherEffects.length > 0 && (
          <div>
            <h4 className="mb-2 font-medium text-blue-800">Other Effects</h4>
            <div className="space-y-1">
              {bonuses.otherEffects.map((effect, index) => (
                <div
                  key={index}
                  className="p-2 text-sm text-gray-700 bg-white border rounded"
                >
                  {effect}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Equipped Items List */}
      <div className="pt-4 mt-4 border-t border-blue-300">
        <h4 className="mb-2 font-medium text-blue-800">Equipped Items</h4>
        <div className="space-y-1">
          {equippedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 bg-white border rounded cursor-pointer hover:bg-gray-50"
              onClick={() => onItemDetails?.(item)}
            >
              <span className="text-sm font-medium">{item.item.name}</span>
              <span className="text-xs text-gray-500">
                {item.item.type
                  .replace("_", " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
