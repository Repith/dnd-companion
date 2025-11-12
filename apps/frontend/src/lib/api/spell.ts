import api from "./auth";
import {
  SpellResponseDto,
  CreateSpellDto,
  UpdateSpellDto,
  SpellFilters,
} from "@/types/spell";

export const spellApi = {
  // Get all spells with optional filters
  getAll: async (filters?: SpellFilters): Promise<SpellResponseDto[]> => {
    const params = new URLSearchParams();

    if (filters?.level !== undefined) {
      params.append("level", filters.level.toString());
    }
    if (filters?.school) {
      params.append("school", filters.school);
    }
    if (filters?.class) {
      params.append("class", filters.class);
    }
    if (filters?.search) {
      params.append("search", filters.search);
    }

    const queryString = params.toString();
    const url = `/spells${queryString ? `?${queryString}` : ""}`;

    const response = await api.get<SpellResponseDto[]>(url);
    return response.data;
  },

  // Get a specific spell by ID
  getById: async (id: string): Promise<SpellResponseDto> => {
    const response = await api.get<SpellResponseDto>(`/spells/${id}`);
    return response.data;
  },

  // Create a new spell
  create: async (spellData: CreateSpellDto): Promise<SpellResponseDto> => {
    const response = await api.post<SpellResponseDto>("/spells", spellData);
    return response.data;
  },

  // Update an existing spell
  update: async (
    id: string,
    spellData: UpdateSpellDto,
  ): Promise<SpellResponseDto> => {
    const response = await api.patch<SpellResponseDto>(
      `/spells/${id}`,
      spellData,
    );
    return response.data;
  },

  // Delete a spell
  delete: async (id: string): Promise<void> => {
    await api.delete(`/spells/${id}`);
  },

  // Import spells from SRD
  importFromSRD: async (): Promise<{ message: string; count: number }> => {
    const response = await api.post<{ message: string; count: number }>(
      "/spells/import-srd",
    );
    return response.data;
  },
};
