import { EventResponseDto } from "@/types/event";
import api from "./auth";
import {
  CreateSessionDto,
  SessionResponseDto,
  CreateEventDto,
  HPAdjustmentDto,
  ItemGrantDto,
} from "@/types/session";

export const sessionApi = {
  // Get all sessions for a campaign
  getAll: async (campaignId: string): Promise<SessionResponseDto[]> => {
    const response = await api.get<SessionResponseDto[]>(
      `/campaigns/${campaignId}/sessions`,
    );
    return response.data;
  },

  // Get a specific session by ID
  getById: async (id: string): Promise<SessionResponseDto> => {
    const response = await api.get<SessionResponseDto>(`/sessions/${id}`);
    return response.data;
  },

  // Create a new session
  create: async (
    campaignId: string,
    sessionData: CreateSessionDto,
  ): Promise<SessionResponseDto> => {
    const response = await api.post<SessionResponseDto>(
      `/campaigns/${campaignId}/sessions`,
      sessionData,
    );
    return response.data;
  },

  // Update an existing session
  update: async (
    id: string,
    sessionData: Partial<CreateSessionDto>,
  ): Promise<SessionResponseDto> => {
    const response = await api.put<SessionResponseDto>(
      `/sessions/${id}`,
      sessionData,
    );
    return response.data;
  },

  // Delete a session
  delete: async (id: string): Promise<void> => {
    await api.delete(`/sessions/${id}`);
  },

  // Log an event in a session
  logEvent: async (
    sessionId: string,
    eventData: CreateEventDto,
  ): Promise<EventResponseDto> => {
    const response = await api.post<EventResponseDto>(
      `/sessions/${sessionId}/events`,
      eventData,
    );
    return response.data;
  },

  // Get events for a session
  getEvents: async (sessionId: string): Promise<EventResponseDto[]> => {
    const response = await api.get<EventResponseDto[]>(
      `/sessions/${sessionId}/events`,
    );
    return response.data;
  },

  // Adjust HP for a character in a session
  adjustHP: async (
    sessionId: string,
    hpData: HPAdjustmentDto,
  ): Promise<EventResponseDto> => {
    const response = await api.post<EventResponseDto>(
      `/sessions/${sessionId}/adjust-hp`,
      hpData,
    );
    return response.data;
  },

  // Grant an item to a character in a session
  grantItem: async (
    sessionId: string,
    itemData: ItemGrantDto,
  ): Promise<EventResponseDto> => {
    const response = await api.post<EventResponseDto>(
      `/sessions/${sessionId}/grant-item`,
      itemData,
    );
    return response.data;
  },

  // Roll dice in a session
  rollDice: async (
    sessionId: string,
    rollData: {
      notation: string;
      result: number;
      label?: string;
      characterId?: string;
      individualResults?: number[];
    },
  ): Promise<void> => {
    await api.post(`/sessions/${sessionId}/rolls`, rollData);
  },
};
