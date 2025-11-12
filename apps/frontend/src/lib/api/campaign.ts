import api from "./auth";
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CampaignResponseDto,
} from "@/types/campaign";

export const campaignApi = {
  // Get all campaigns for the authenticated user
  getAll: async (): Promise<CampaignResponseDto[]> => {
    const response = await api.get<CampaignResponseDto[]>("/campaigns");
    return response.data;
  },

  // Get a specific campaign by ID
  getById: async (id: string): Promise<CampaignResponseDto> => {
    const response = await api.get<CampaignResponseDto>(`/campaigns/${id}`);
    return response.data;
  },

  // Create a new campaign
  create: async (
    campaignData: CreateCampaignDto,
  ): Promise<CampaignResponseDto> => {
    const response = await api.post<CampaignResponseDto>(
      "/campaigns",
      campaignData,
    );
    return response.data;
  },

  // Update an existing campaign
  update: async (
    id: string,
    campaignData: UpdateCampaignDto,
  ): Promise<CampaignResponseDto> => {
    const response = await api.put<CampaignResponseDto>(
      `/campaigns/${id}`,
      campaignData,
    );
    return response.data;
  },

  // Delete a campaign
  delete: async (id: string): Promise<void> => {
    await api.delete(`/campaigns/${id}`);
  },

  // Add a player to a campaign
  addPlayer: async (
    campaignId: string,
    playerId: string,
  ): Promise<CampaignResponseDto> => {
    const response = await api.post<CampaignResponseDto>(
      `/campaigns/${campaignId}/players/${playerId}`,
    );
    return response.data;
  },

  // Remove a player from a campaign
  removePlayer: async (
    campaignId: string,
    playerId: string,
  ): Promise<CampaignResponseDto> => {
    const response = await api.delete<CampaignResponseDto>(
      `/campaigns/${campaignId}/players/${playerId}`,
    );
    return response.data;
  },
};
