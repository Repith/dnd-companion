import api from "./auth";
import {
  InventoryResponseDto,
  AddItemDto,
  UpdateInventoryItemDto,
  EquipItemDto,
} from "@/types/inventory";

export const inventoryApi = {
  // Get inventory by ID
  getById: async (id: string): Promise<InventoryResponseDto> => {
    const response = await api.get<InventoryResponseDto>(`/inventories/${id}`);
    return response.data;
  },

  // Get character inventory
  getCharacterInventory: async (
    characterId: string,
  ): Promise<InventoryResponseDto> => {
    const response = await api.get<InventoryResponseDto>(
      `/inventories/character/${characterId}`,
    );
    return response.data;
  },

  // Add item to inventory
  addItem: async (
    inventoryId: string,
    itemData: AddItemDto,
  ): Promise<InventoryResponseDto> => {
    const response = await api.post<InventoryResponseDto>(
      `/inventories/${inventoryId}/items`,
      itemData,
    );
    return response.data;
  },

  // Remove item from inventory
  removeItem: async (
    inventoryId: string,
    itemId: string,
    quantity?: number,
  ): Promise<InventoryResponseDto> => {
    const params = quantity ? `?quantity=${quantity}` : "";
    const response = await api.delete<InventoryResponseDto>(
      `/inventories/${inventoryId}/items/${itemId}${params}`,
    );
    return response.data;
  },

  // Update item in inventory
  updateItem: async (
    inventoryId: string,
    itemId: string,
    updateData: UpdateInventoryItemDto,
  ): Promise<InventoryResponseDto> => {
    const response = await api.patch<InventoryResponseDto>(
      `/inventories/${inventoryId}/items/${itemId}`,
      updateData,
    );
    return response.data;
  },

  // Equip/unequip item
  equipItem: async (
    inventoryId: string,
    itemId: string,
    equipData: EquipItemDto,
  ): Promise<InventoryResponseDto> => {
    const response = await api.patch<InventoryResponseDto>(
      `/inventories/${inventoryId}/items/${itemId}/equip`,
      equipData,
    );
    return response.data;
  },
};
