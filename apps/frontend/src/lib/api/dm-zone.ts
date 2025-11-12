import api from "./auth";
import {
  DMNoteResponseDto,
  CreateDMNoteDto,
  UpdateDMNoteDto,
  LinkResponseDto,
  CreateLinkDto,
  LocationResponseDto,
  CreateLocationDto,
  UpdateLocationDto,
} from "@/types/dm-zone";

export const dmNoteApi = {
  // Get all DM notes
  getAll: async (): Promise<DMNoteResponseDto[]> => {
    const response = await api.get<DMNoteResponseDto[]>("/dm-notes");
    return response.data;
  },

  // Get a specific DM note by ID
  getById: async (id: string): Promise<DMNoteResponseDto | null> => {
    const response = await api.get<DMNoteResponseDto | null>(`/dm-notes/${id}`);
    return response.data;
  },

  // Create a new DM note
  create: async (noteData: CreateDMNoteDto): Promise<DMNoteResponseDto> => {
    const response = await api.post<DMNoteResponseDto>("/dm-notes", noteData);
    return response.data;
  },

  // Update an existing DM note
  update: async (
    id: string,
    noteData: UpdateDMNoteDto,
  ): Promise<DMNoteResponseDto> => {
    const response = await api.put<DMNoteResponseDto>(
      `/dm-notes/${id}`,
      noteData,
    );
    return response.data;
  },

  // Delete a DM note
  delete: async (id: string): Promise<void> => {
    await api.delete(`/dm-notes/${id}`);
  },

  // Create a link for a DM note
  createLink: async (
    noteId: string,
    linkData: CreateLinkDto,
  ): Promise<LinkResponseDto> => {
    const response = await api.post<LinkResponseDto>(
      `/dm-notes/${noteId}/links`,
      linkData,
    );
    return response.data;
  },

  // Get links for a DM note
  getLinks: async (noteId: string): Promise<LinkResponseDto[]> => {
    const response = await api.get<LinkResponseDto[]>(
      `/dm-notes/${noteId}/links`,
    );
    return response.data;
  },

  // Delete a link
  deleteLink: async (linkId: string): Promise<void> => {
    await api.delete(`/dm-notes/links/${linkId}`);
  },
};

export const locationApi = {
  // Get all locations for a campaign
  getAll: async (campaignId: string): Promise<LocationResponseDto[]> => {
    const response = await api.get<LocationResponseDto[]>(
      `/campaigns/${campaignId}/locations`,
    );
    return response.data;
  },

  // Get location hierarchy for a campaign
  getHierarchy: async (campaignId: string): Promise<LocationResponseDto[]> => {
    const response = await api.get<LocationResponseDto[]>(
      `/campaigns/${campaignId}/locations/hierarchy`,
    );
    return response.data;
  },

  // Get a specific location by ID
  getById: async (
    campaignId: string,
    id: string,
  ): Promise<LocationResponseDto | null> => {
    const response = await api.get<LocationResponseDto | null>(
      `/campaigns/${campaignId}/locations/${id}`,
    );
    return response.data;
  },

  // Create a new location
  create: async (
    campaignId: string,
    locationData: CreateLocationDto,
  ): Promise<LocationResponseDto> => {
    const response = await api.post<LocationResponseDto>(
      `/campaigns/${campaignId}/locations`,
      locationData,
    );
    return response.data;
  },

  // Update an existing location
  update: async (
    campaignId: string,
    id: string,
    locationData: UpdateLocationDto,
  ): Promise<LocationResponseDto> => {
    const response = await api.put<LocationResponseDto>(
      `/campaigns/${campaignId}/locations/${id}`,
      locationData,
    );
    return response.data;
  },

  // Delete a location
  delete: async (campaignId: string, id: string): Promise<void> => {
    await api.delete(`/campaigns/${campaignId}/locations/${id}`);
  },
};
