export enum QuestStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface CreateQuestDto {
  name: string;
  summary?: string;
  description?: string;
  experienceReward?: number;
  npcIds?: string[];
  locationIds?: string[];
  notes?: string;
}

export interface UpdateQuestDto {
  name?: string;
  summary?: string;
  description?: string;
  status?: QuestStatus;
  experienceReward?: number;
  npcIds?: string[];
  locationIds?: string[];
  notes?: string;
}

export interface QuestResponseDto {
  id: string;
  campaignId: string;
  name: string;
  summary: string | null;
  description: string | null;
  status: QuestStatus;
  experienceReward: number;
  loot: any;
  npcIds: string[];
  locationIds: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestProgressUpdateDto {
  characterId: string;
  status: QuestStatus;
}
