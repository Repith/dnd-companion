import { EventType } from "./event-types";

// Re-export shared event types
export { EventType } from "./event-types";
export type {
  BaseEvent,
  // Session events
  SessionCreatedEvent,
  SessionUpdatedEvent,
  SessionDeletedEvent,
  CombatStartedEvent,
  CombatEndedEvent,
  // Dice roll events
  RollEvent,
  CheckRollEvent,
  // Character events
  CharacterCreatedEvent,
  CharacterUpdatedEvent,
  CharacterDeletedEvent,
  DamageAppliedEvent,
  HealingReceivedEvent,
  TempHPGainedEvent,
  DeathEvent,
  LevelUpEvent,
  ExperienceGainedEvent,
  SkillProficiencyAddedEvent,
  // Spell events
  SpellCastEvent,
  SpellLearntEvent,
  SpellPreparedEvent,
  SpellUnpreparedEvent,
  // Inventory events
  ItemGivenEvent,
  ItemUsedEvent,
  ItemEquippedEvent,
  ItemUnequippedEvent,
  // Quest and campaign events
  QuestCreatedEvent,
  QuestUpdatedEvent,
  QuestFinishedEvent,
  QuestRewardClaimedEvent,
  CampaignCreatedEvent,
  CampaignUpdatedEvent,
  // Note events
  NoteAddedEvent,
  NoteUpdatedEvent,
  NoteDeletedEvent,
  // System events
  UserLoggedInEvent,
  UserLoggedOutEvent,
  ErrorOccurredEvent,
  GameEvent,
  EventHandler,
  EventFilter,
} from "./event-types";

export interface EventQueryDto {
  limit?: number;
  offset?: number;
  sessionId?: string;
  campaignId?: string;
  global?: boolean;
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
  sessionId: string | null;
  campaignId: string | null;
  global: boolean | null;
}

export interface EventStatsDto {
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  eventsBySession: Record<string, number>;
  eventsByCampaign: Record<string, number>;
  recentEvents: EventResponseDto[];
}

export interface EventsResponseDto {
  events: EventResponseDto[];
  total: number;
  limit: number;
  offset: number;
}
