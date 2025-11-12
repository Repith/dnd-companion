export enum GeneratorType {
  NPC = "NPC",
  LOCATION = "LOCATION",
  CAMPAIGN = "CAMPAIGN",
  ITEM = "ITEM",
  SPELL = "SPELL",
}

export enum GeneratorStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface CreateGeneratorRequest {
  type: GeneratorType;
  tags: string[];
  prompt?: string;
}

export interface GeneratorRequest {
  id: string;
  type: GeneratorType;
  tags: string[];
  prompt?: string;
  status: GeneratorStatus;
  resultId?: string;
  createdAt: string;
}

export interface GeneratedEntity {
  id: string;
  entityType: string;
  data: any;
  createdAt: string;
}

export interface GeneratedNPC {
  name: string;
  race: string;
  class: string;
  level: number;
  background: string;
  alignment: string;
  personalityTraits: string[];
  tags: string[];
}

export interface GeneratedLocation {
  name: string;
  type: string;
  description: string;
  tags: string[];
}

export interface GeneratedQuest {
  name: string;
  description: string;
  tags: string[];
}
