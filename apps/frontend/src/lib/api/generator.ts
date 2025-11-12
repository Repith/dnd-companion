import api from "./auth";
import {
  CreateGeneratorRequest,
  GeneratorRequest,
  GeneratedEntity,
} from "@/types/generator";

export const generatorApi = {
  // Create a new generation request
  createRequest: async (
    requestData: CreateGeneratorRequest,
  ): Promise<GeneratorRequest> => {
    const response = await api.post<GeneratorRequest>(
      "/generator/requests",
      requestData,
    );
    return response.data;
  },

  // Get all generation requests
  getAllRequests: async (): Promise<GeneratorRequest[]> => {
    const response = await api.get<GeneratorRequest[]>("/generator/requests");
    return response.data;
  },

  // Get a specific generation request by ID
  getRequestById: async (id: string): Promise<GeneratorRequest> => {
    const response = await api.get<GeneratorRequest>(
      `/generator/requests/${id}`,
    );
    return response.data;
  },

  // Get a generated entity by ID
  getGeneratedEntityById: async (id: string): Promise<GeneratedEntity> => {
    const response = await api.get<GeneratedEntity>(
      `/generator/entities/${id}`,
    );
    return response.data;
  },
};
