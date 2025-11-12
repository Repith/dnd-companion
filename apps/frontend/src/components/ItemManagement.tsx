"use client";

import { useState } from "react";
import { ItemResponseDto } from "@/types/item";
import { InventoryResponseDto } from "@/types/inventory";
import { inventoryApi } from "@/lib/api/inventory";
import InventoryDisplay from "./InventoryDisplay";
import ItemCatalog from "./ItemCatalog";
import StatEffectsDisplay from "./StatEffectsDisplay";

interface ItemManagementProps {
  characterId: string;
  onInventoryChange?: (inventory: InventoryResponseDto) => void;
}

export default function ItemManagement({
  characterId,
  onInventoryChange,
}: ItemManagementProps) {
  const [activeTab, setActiveTab] = useState<"inventory" | "catalog">(
    "inventory",
  );
  const [currentInventory, setCurrentInventory] =
    useState<InventoryResponseDto | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemResponseDto | null>(
    null,
  );
  const [addQuantity, setAddQuantity] = useState(1);
  const [addNotes, setAddNotes] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  const handleAddToInventory = (item: ItemResponseDto) => {
    setSelectedItem(item);
    setAddQuantity(1);
    setAddNotes("");
    setShowAddModal(true);
  };

  const handleConfirmAdd = async () => {
    if (!selectedItem) return;

    try {
      setAddingItem(true);
      const inventory = await inventoryApi.getCharacterInventory(characterId);
      const addItemData: any = {
        itemId: selectedItem.id,
        quantity: addQuantity,
      };
      if (addNotes.trim()) {
        addItemData.notes = addNotes.trim();
      }
      const updatedInventory = await inventoryApi.addItem(
        inventory.id,
        addItemData,
      );

      onInventoryChange?.(updatedInventory);
      setShowAddModal(false);
      setSelectedItem(null);
    } catch (err) {
      console.error("Error adding item:", err);
      alert("Failed to add item to inventory");
    } finally {
      setAddingItem(false);
    }
  };

  const handleInventoryChange = (inventory: InventoryResponseDto) => {
    setCurrentInventory(inventory);
    onInventoryChange?.(inventory);
  };

  const tabs = [
    { id: "inventory" as const, label: "Inventory", icon: "🎒" },
    { id: "catalog" as const, label: "Item Catalog", icon: "📚" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav
          className="flex -mb-px space-x-8"
          role="tablist"
          aria-label="Inventory management tabs"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              id={`${tab.id}-tab`}
            >
              <span className="mr-2" aria-hidden="true">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === "inventory" && (
          <div
            className="space-y-6"
            role="tabpanel"
            aria-labelledby="inventory-tab"
            id="inventory-panel"
          >
            <InventoryDisplay
              characterId={characterId}
              onItemSelect={(item) => {
                // Could open item details modal here
                console.log("Selected item:", item);
              }}
              onItemEquip={async (itemId, equipped) => {
                // The InventoryDisplay handles the API call, but we need to refresh our state
                // This callback is called after the API operation succeeds
                try {
                  const updatedInventory =
                    await inventoryApi.getCharacterInventory(characterId);
                  handleInventoryChange(updatedInventory);
                } catch (error) {
                  console.error("Error refreshing inventory:", error);
                }
              }}
              onInventoryLoad={(inventory) => {
                setCurrentInventory(inventory);
              }}
            />

            {/* Stat Effects Display */}
            {currentInventory && (
              <div className="mt-6">
                <StatEffectsDisplay
                  inventory={currentInventory}
                  onItemDetails={(item) => {
                    console.log("Item details:", item);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "catalog" && (
          <div role="tabpanel" aria-labelledby="catalog-tab" id="catalog-panel">
            <ItemCatalog
              onItemSelect={(item) => {
                // Could open item details modal here
                console.log("Selected item:", item);
              }}
              onAddToInventory={handleAddToInventory}
              showAddButton={true}
            />
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && selectedItem && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-item-modal-title"
        >
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowAddModal(false)}
              aria-hidden="true"
            ></div>

            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3
                  id="add-item-modal-title"
                  className="text-lg font-medium text-gray-900"
                >
                  Add Item to Inventory
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close modal"
                >
                  <span className="sr-only">Close</span>×
                </button>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900">
                  {selectedItem.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {selectedItem.type
                    .replace("_", " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                  •
                  {selectedItem.rarity
                    .replace("_", " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                  •{selectedItem.weight} lbs
                </p>
                {selectedItem.description && (
                  <p className="mt-2 text-sm text-gray-700">
                    {selectedItem.description}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="quantity"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    value={addQuantity}
                    onChange={(e) =>
                      setAddQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    aria-describedby="quantity-help"
                  />
                  <div id="quantity-help" className="sr-only">
                    Enter the quantity of items to add (minimum 1)
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    value={addNotes}
                    onChange={(e) => setAddNotes(e.target.value)}
                    rows={3}
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any notes about this item..."
                    aria-describedby="notes-help"
                  />
                  <div id="notes-help" className="sr-only">
                    Optional notes about the item (maximum 500 characters)
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6 space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={addingItem}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAdd}
                  disabled={addingItem}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {addingItem ? "Adding..." : "Add to Inventory"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
