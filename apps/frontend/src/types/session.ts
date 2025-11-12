export interface CreateSessionDto {
  date?: Date;
  notes?: string;
  playerCharacterIds?: string[];
}

export interface CreateEventDto {
  type: string;
  payload?: any;
}

export interface SessionResponseDto {
  id: string;
  campaignId: string;
  date: Date;
  notes: string | null;
  playerCharacterIds: string[];
  createdAt: Date;
}

export interface EventResponseDto {
  id: string;
  type: string;
  timestamp: Date;
  actorId: string | null;
  targetId: string | null;
  payload: any;
  sessionId: string;
}

export interface HPAdjustmentDto {
  characterId: string;
  hpAdjustment: number;
}

export interface ItemGrantDto {
  characterId: string;
  itemId: string;
  quantity?: number;
}
