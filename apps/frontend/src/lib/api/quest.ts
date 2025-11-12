import api from "./auth";
import {
  CreateQuestDto,
  UpdateQuestDto,
  QuestResponseDto,
  QuestProgressUpdateDto,
  QuestStatus,
} from "@/types/quest";

export const questApi = {
  // Get all quests for a campaign
  getAll: async (campaignId: string): Promise<QuestResponseDto[]> => {
    const response = await api.get<QuestResponseDto[]>(
      `/campaigns/${campaignId}/quests`,
    );
    return response.data;
  },

  // Get a specific quest by ID
  getById: async (id: string): Promise<QuestResponseDto> => {
    const response = await api.get<QuestResponseDto>(`/quests/${id}`);
    return response.data;
  },

  // Create a new quest
  create: async (
    campaignId: string,
    questData: CreateQuestDto,
  ): Promise<QuestResponseDto> => {
    const response = await api.post<QuestResponseDto>(
      `/campaigns/${campaignId}/quests`,
      questData,
    );
    return response.data;
  },

  // Update an existing quest
  update: async (
    id: string,
    questData: UpdateQuestDto,
  ): Promise<QuestResponseDto> => {
    const response = await api.put<QuestResponseDto>(
      `/quests/${id}`,
      questData,
    );
    return response.data;
  },

  // Delete a quest
  delete: async (id: string): Promise<void> => {
    await api.delete(`/quests/${id}`);
  },

  // Update quest progress for a character
  updateProgress: async (
    questId: string,
    progressData: QuestProgressUpdateDto,
  ): Promise<void> => {
    await api.post(`/quests/${questId}/progress`, progressData);
  },

  // Award quest rewards
  awardRewards: async (questId: string): Promise<void> => {
    await api.post(`/quests/${questId}/rewards`);
  },
};
