import { EventType as EventTypeConst } from "@prisma/client";
import type { EventType as EventTypeType } from "@prisma/client";

export const EventType = EventTypeConst;
export type EventType = EventTypeType;

/**
 * Base event interface
 */
export interface BaseEvent {
  id?: string;
  type: EventType;
  timestamp?: Date;
  actorId?: string;
  targetId?: string;
  sessionId?: string;
  payload?: Record<string, any>;
}

/**
 * Damage applied event
 */
export interface DamageAppliedEvent extends BaseEvent {
  type: "DAMAGE_APPLIED";
  payload: {
    damage: number;
    damageType: string;
    source?: string;
  };
}

/**
 * Healing received event
 */
export interface HealingReceivedEvent extends BaseEvent {
  type: "HEALING_RECEIVED";
  payload: {
    healing: number;
    source?: string;
  };
}

/**
 * Item given event
 */
export interface ItemGivenEvent extends BaseEvent {
  type: "ITEM_GIVEN";
  payload: {
    itemId: string;
    quantity: number;
    fromInventoryId?: string;
    toInventoryId?: string;
  };
}

/**
 * Spell cast event
 */
export interface SpellCastEvent extends BaseEvent {
  type: "SPELL_CAST";
  payload: {
    spellId: string;
    spellLevel?: number;
    targets?: string[];
  };
}

/**
 * Quest updated event
 */
export interface QuestUpdatedEvent extends BaseEvent {
  type: "QUEST_UPDATED";
  payload: {
    questId: string;
    oldStatus?: string;
    newStatus: string;
    experienceReward?: number;
  };
}

/**
 * Level up event
 */
export interface LevelUpEvent extends BaseEvent {
  type: "LEVEL_UP";
  payload: {
    newLevel: number;
    oldLevel: number;
  };
}

/**
 * Death event
 */
export interface DeathEvent extends BaseEvent {
  type: "DEATH";
  payload: {
    cause?: string;
  };
}

/**
 * Union type of all game events
 */
export type GameEvent =
  | DamageAppliedEvent
  | HealingReceivedEvent
  | ItemGivenEvent
  | SpellCastEvent
  | QuestUpdatedEvent
  | LevelUpEvent
  | DeathEvent;

/**
 * Event handler function type
 */
export type EventHandler<T extends GameEvent = GameEvent> = (
  event: T,
) => Promise<void> | void;

/**
 * Event filter for subscribing to specific events
 */
export interface EventFilter {
  type?: EventType;
  actorId?: string;
  targetId?: string;
  sessionId?: string;
}
