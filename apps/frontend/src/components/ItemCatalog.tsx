"use client";

import { useState, useEffect } from "react";
import { ItemResponseDto, ItemType, Rarity } from "@/types/item";
import { itemApi } from "@/lib/api/item";

interface ItemCatalogProps {
  onItemSelect?: (item: ItemResponseDto) => void;
  onAddToInventory?: (item: ItemResponseDto) => void;
  showAddButton?: boolean;
}

export default function ItemCatalog({
  onItemSelect,
  onAddToInventory,
  showAddButton = false,
}: ItemCatalogProps) {
  const [items, setItems] = useState<ItemResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<ItemType | "">("");
  const [selectedRarity, setSelectedRarity] = useState<Rarity | "">("");

  useEffect(() => {
    loadItems();
  }, [searchTerm, selectedType, selectedRarity]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const filters = {
        ...(selectedType && { type: selectedType }),
        ...(selectedRarity && { rarity: selectedRarity }),
        ...(searchTerm && { search: searchTerm }),
      };
      const data = await itemApi.getAll(filters);
      setItems(data);
    } catch (err) {
      setError("Failed to load items");
      console.error("Error loading items:", err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setSelectedRarity("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-b-2 border-blue-600 rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">Loading items...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <div className="mb-4 text-red-600">{error}</div>
        <button
          onClick={loadItems}
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="p-4 rounded-lg bg-gray-50">
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div className="md:w-48">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ItemType | "")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {Object.values(ItemType).map((type) => (
                <option key={type} value={type}>
                  {type
                    .replace("_", " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Rarity Filter */}
          <div className="md:w-48">
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value as Rarity | "")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Rarities</option>
              {Object.values(Rarity).map((rarity) => (
                <option key={rarity} value={rarity}>
                  {rarity
                    .replace("_", " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Items ({items.length})
        </h2>
      </div>

      {/* Items Grid */}
      {items.length === 0 ? (
        <div className="py-8 text-center">
          <div className="mb-4 text-gray-500">No items found</div>
          {(searchTerm || selectedType || selectedRarity) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onSelect={onItemSelect}
              onAddToInventory={onAddToInventory}
              showAddButton={showAddButton}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ItemCardProps {
  item: ItemResponseDto;
  onSelect?: (item: ItemResponseDto) => void;
  onAddToInventory?: (item: ItemResponseDto) => void;
  showAddButton?: boolean;
}

function ItemCard({
  item,
  onSelect,
  onAddToInventory,
  showAddButton = false,
}: ItemCardProps) {
  const getRarityColor = (rarity: Rarity) => {
    switch (rarity) {
      case Rarity.COMMON:
        return "bg-gray-100 text-gray-800";
      case Rarity.UNCOMMON:
        return "bg-green-100 text-green-800";
      case Rarity.RARE:
        return "bg-blue-100 text-blue-800";
      case Rarity.VERY_RARE:
        return "bg-purple-100 text-purple-800";
      case Rarity.LEGENDARY:
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 transition-shadow bg-white border rounded-lg shadow-sm hover:shadow-md">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{item.name}</h3>
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${getRarityColor(
            item.rarity,
          )}`}
        >
          {item.rarity
            .replace("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
      </div>

      <div className="mb-3 space-y-1 text-sm text-gray-600">
        <div>
          Type:{" "}
          {item.type
            .replace("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, (l) => l.toUpperCase())}
        </div>
        <div>Weight: {item.weight} lbs</div>
      </div>

      {item.description && (
        <p className="mb-3 text-sm text-gray-700 line-clamp-2">
          {item.description}
        </p>
      )}

      {/* Properties Preview */}
      {item.properties && (
        <div className="mb-3 text-xs text-gray-500">
          {item.properties.damageDice && (
            <div>Damage: {item.properties.damageDice}</div>
          )}
          {item.properties.armorClassBonus && (
            <div>AC Bonus: +{item.properties.armorClassBonus}</div>
          )}
          {item.properties.attunement && <div>Requires Attunement</div>}
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={() => onSelect?.(item)}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          View Details
        </button>

        {showAddButton && (
          <button
            onClick={() => onAddToInventory?.(item)}
            className="px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
          >
            Add to Inventory
          </button>
        )}
      </div>
    </div>
  );
}
