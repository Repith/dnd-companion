import api from "./auth";
import {
  CreateItemDto,
  UpdateItemDto,
  ItemResponseDto,
  ItemType,
  Rarity,
} from "@/types/item";

export const itemApi = {
  // Get all items with optional filters
  getAll: async (filters?: {
    type?: ItemType;
    rarity?: Rarity;
    search?: string;
  }): Promise<ItemResponseDto[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append("type", filters.type);
    if (filters?.rarity) params.append("rarity", filters.rarity);
    if (filters?.search) params.append("search", filters.search);

    const queryString = params.toString();
    const url = queryString ? `/items?${queryString}` : "/items";

    const response = await api.get<ItemResponseDto[]>(url);
    return response.data;
  },

  // Get a specific item by ID
  getById: async (id: string): Promise<ItemResponseDto> => {
    const response = await api.get<ItemResponseDto>(`/items/${id}`);
    return response.data;
  },

  // Create a new item
  create: async (itemData: CreateItemDto): Promise<ItemResponseDto> => {
    const response = await api.post<ItemResponseDto>("/items", itemData);
    return response.data;
  },

  // Update an existing item
  update: async (
    id: string,
    itemData: UpdateItemDto,
  ): Promise<ItemResponseDto> => {
    const response = await api.patch<ItemResponseDto>(`/items/${id}`, itemData);
    return response.data;
  },

  // Delete an item
  delete: async (id: string): Promise<void> => {
    await api.delete(`/items/${id}`);
  },
};
