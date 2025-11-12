import api from "./auth";
import {
  FeatureResponseDto,
  CreateFeatureDto,
  UpdateFeatureDto,
  FeatureFilters,
} from "@/types/feature";

export const featureApi = {
  // Get all features with optional filters
  getAll: async (filters?: FeatureFilters): Promise<FeatureResponseDto[]> => {
    const params = new URLSearchParams();

    if (filters?.level !== undefined) {
      params.append("level", filters.level.toString());
    }
    if (filters?.source) {
      params.append("source", filters.source);
    }
    if (filters?.search) {
      params.append("search", filters.search);
    }

    const queryString = params.toString();
    const url = `/features${queryString ? `?${queryString}` : ""}`;

    const response = await api.get<FeatureResponseDto[]>(url);
    return response.data;
  },

  // Get a specific feature by ID
  getById: async (id: string): Promise<FeatureResponseDto> => {
    const response = await api.get<FeatureResponseDto>(`/features/${id}`);
    return response.data;
  },

  // Create a new feature
  create: async (
    featureData: CreateFeatureDto,
  ): Promise<FeatureResponseDto> => {
    const response = await api.post<FeatureResponseDto>(
      "/features",
      featureData,
    );
    return response.data;
  },

  // Update an existing feature
  update: async (
    id: string,
    featureData: UpdateFeatureDto,
  ): Promise<FeatureResponseDto> => {
    const response = await api.patch<FeatureResponseDto>(
      `/features/${id}`,
      featureData,
    );
    return response.data;
  },

  // Delete a feature
  delete: async (id: string): Promise<void> => {
    await api.delete(`/features/${id}`);
  },
};
