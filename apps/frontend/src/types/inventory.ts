import { OwnerType } from "@dnd-companion/domain";

// Re-export for backward compatibility
export { OwnerType };

export enum InventoryOperation {
  ADD_ITEM = "ADD_ITEM",
  REMOVE_ITEM = "REMOVE_ITEM",
  UPDATE_QUANTITY = "UPDATE_QUANTITY",
  EQUIP_ITEM = "EQUIP_ITEM",
  UNEQUIP_ITEM = "UNEQUIP_ITEM",
}

export interface AddItemDto {
  itemId: string;
  quantity?: number;
  notes?: string;
}

export interface EquipItemDto {
  equipped: boolean;
}

export interface UpdateInventoryItemDto {
  quantity?: number;
  equipped?: boolean;
  notes?: string;
}

export interface InventoryItemResponseDto {
  id: string;
  itemId: string;
  item: {
    id: string;
    name: string;
    type: string;
    weight: number;
    rarity: string;
  };
  quantity: number;
  equipped: boolean;
  notes?: string;
}

export interface EncumbranceResponseDto {
  currentWeight: number;
  maxWeight: number;
  isEncumbered: boolean;
}

export interface InventoryResponseDto {
  id: string;
  ownerType: OwnerType;
  ownerId: string;
  items: InventoryItemResponseDto[];
  encumbrance?: EncumbranceResponseDto;
}

// Additional types for frontend
export interface InventoryItemWithDetails extends InventoryItemResponseDto {
  item: {
    id: string;
    name: string;
    type: string;
    weight: number;
    rarity: string;
    description?: string;
    properties?: any;
    effects?: any;
  };
}

export interface InventoryStats {
  totalItems: number;
  totalWeight: number;
  equippedItems: number;
  encumbrancePercentage: number;
}
