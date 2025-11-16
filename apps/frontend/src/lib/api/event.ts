import api from "./auth";
import { EventQueryDto, EventsResponseDto, EventStatsDto } from "@/types/event";

export const eventApi = {
  // Get events with filtering and pagination
  getEvents: async (query?: EventQueryDto): Promise<EventsResponseDto> => {
    const response = await api.get<EventsResponseDto>("/events", {
      params: query,
    });
    return response.data;
  },

  // Get event statistics
  getStats: async (params?: {
    sessionId?: string;
    campaignId?: string;
    global?: boolean;
  }): Promise<EventStatsDto> => {
    const response = await api.get<EventStatsDto>("/events/stats", {
      params,
    });
    return response.data;
  },

  // Get events for a specific campaign
  getCampaignEvents: async (
    campaignId: string,
    query?: Omit<EventQueryDto, "campaignId">,
  ): Promise<EventsResponseDto> => {
    const response = await api.get<EventsResponseDto>(
      `/events/campaign/${campaignId}`,
      {
        params: query,
      },
    );
    return response.data;
  },

  // Get events for a specific session
  getSessionEvents: async (
    sessionId: string,
    query?: Omit<EventQueryDto, "sessionId">,
  ): Promise<EventsResponseDto> => {
    const response = await api.get<EventsResponseDto>(
      `/events/session/${sessionId}`,
      {
        params: query,
      },
    );
    return response.data;
  },

  // Get events for a specific character
  getCharacterEvents: async (
    characterId: string,
    query?: Omit<EventQueryDto, "actorId" | "targetId">,
  ): Promise<EventsResponseDto> => {
    const response = await api.get<EventsResponseDto>(
      `/events/character/${characterId}`,
      {
        params: query,
      },
    );
    return response.data;
  },
};
