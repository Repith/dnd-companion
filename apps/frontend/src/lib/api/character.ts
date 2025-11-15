import api from "./auth";
import { withApiRetry } from "./error-handler";
import {
  CreateCharacterDto,
  UpdateCharacterDto,
  CharacterResponseDto,
} from "@/types/character";

export const characterApi = {
  // Get all characters for the authenticated user
  getAll: async (): Promise<CharacterResponseDto[]> => {
    return withApiRetry(async () => {
      const response = await api.get<CharacterResponseDto[]>("/characters");
      return response.data;
    });
  },

  // Get all demo characters (public endpoint)
  getDemo: async (): Promise<CharacterResponseDto[]> => {
    return withApiRetry(async () => {
      const response = await api.get<CharacterResponseDto[]>(
        "/characters/demo",
      );
      return response.data;
    });
  },

  // Get a specific character by ID
  getById: async (id: string): Promise<CharacterResponseDto> => {
    const response = await api.get<CharacterResponseDto>(`/characters/${id}`);
    return response.data;
  },

  // Create a new character
  create: async (
    characterData: CreateCharacterDto,
  ): Promise<CharacterResponseDto> => {
    const response = await api.post<CharacterResponseDto>(
      "/characters",
      characterData,
    );
    return response.data;
  },

  // Update an existing character
  update: async (
    id: string,
    characterData: UpdateCharacterDto,
  ): Promise<CharacterResponseDto> => {
    const response = await api.patch<CharacterResponseDto>(
      `/characters/${id}`,
      characterData,
    );
    return response.data;
  },

  // Delete a character
  delete: async (id: string): Promise<void> => {
    await api.delete(`/characters/${id}`);
  },

  // Spell management endpoints
  learnSpell: async (
    characterId: string,
    spellId: string,
  ): Promise<CharacterResponseDto> => {
    const response = await api.post<CharacterResponseDto>(
      `/characters/${characterId}/spells/learn`,
      {
        spellId,
      },
    );
    return response.data;
  },

  unlearnSpell: async (
    characterId: string,
    spellId: string,
  ): Promise<CharacterResponseDto> => {
    const response = await api.delete<CharacterResponseDto>(
      `/characters/${characterId}/spells/learn/${spellId}`,
    );
    return response.data;
  },

  prepareSpell: async (
    characterId: string,
    spellId: string,
  ): Promise<CharacterResponseDto> => {
    const response = await api.post<CharacterResponseDto>(
      `/characters/${characterId}/spells/prepare`,
      {
        spellId,
      },
    );
    return response.data;
  },

  unprepareSpell: async (
    characterId: string,
    spellId: string,
  ): Promise<CharacterResponseDto> => {
    const response = await api.delete<CharacterResponseDto>(
      `/characters/${characterId}/spells/prepare/${spellId}`,
    );
    return response.data;
  },

  updateSpellSlots: async (
    characterId: string,
    remainingSlots: Record<string, number>,
  ): Promise<CharacterResponseDto> => {
    const response = await api.put<CharacterResponseDto>(
      `/characters/${characterId}/spell-slots`,
      {
        remainingSlots,
      },
    );
    return response.data;
  },

  // Update skill proficiency
  updateSkillProficiency: async (
    characterId: string,
    skill: string,
    proficient: boolean,
    expertise: boolean,
  ): Promise<void> => {
    await api.post(`/characters/${characterId}/skills/add-proficiency`, {
      skill,
      proficient,
      expertise,
    });
  },
};
