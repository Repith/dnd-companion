export interface FeatureResponseDto {
  id: string;
  name: string;
  description: string;
  source: string;
  level?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFeatureDto {
  name: string;
  description: string;
  source: string;
  level?: number;
}

export interface UpdateFeatureDto {
  name?: string;
  description?: string;
  source?: string;
  level?: number;
}

export interface FeatureFilters {
  level?: number;
  source?: string;
  search?: string;
}
