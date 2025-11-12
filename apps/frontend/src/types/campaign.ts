export interface CreateCampaignDto {
  name: string;
  description?: string;
}

export interface UpdateCampaignDto {
  name?: string;
  description?: string;
}

export interface CampaignResponseDto {
  id: string;
  name: string;
  description: string | null;
  dmId: string;
  playerIds: string[];
  questIds: string[];
  npcIds: string[];
  locationIds: string[];
  currentSessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
