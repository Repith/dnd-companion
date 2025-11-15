// Re-export shared event types
export { EventType } from "./event-types";
export type {
  BaseEvent,
  DamageAppliedEvent,
  HealingReceivedEvent,
  ItemGivenEvent,
  SpellCastEvent,
  QuestUpdatedEvent,
  QuestFinishedEvent,
  LevelUpEvent,
  DeathEvent,
  SkillProficiencyAddedEvent,
  ExperienceGainedEvent,
  RollEvent,
  GameEvent,
  EventHandler,
  EventFilter,
} from "./event-types";

export interface EventQueryDto {
  limit?: number;
  offset?: number;
  sessionId?: string;
  actorId?: string;
  targetId?: string;
  type?: EventType;
  startDate?: Date;
  endDate?: Date;
}

export interface EventResponseDto {
  id: string;
  type: EventType;
  timestamp: Date;
  actorId: string | null;
  targetId: string | null;
  payload: any;
  sessionId: string;
}

export interface EventStatsDto {
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  eventsBySession: Record<string, number>;
  recentActivity: EventResponseDto[];
}

export interface EventsResponseDto {
  events: EventResponseDto[];
  total: number;
  limit: number;
  offset: number;
}
