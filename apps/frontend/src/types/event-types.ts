/**
 * Standardized event types for DnD Companion
 * Shared between backend and frontend
 */
export enum EventType {
  DAMAGE_APPLIED = "DAMAGE_APPLIED",
  HEALING_RECEIVED = "HEALING_RECEIVED",
  ITEM_GIVEN = "ITEM_GIVEN",
  SPELL_CAST = "SPELL_CAST",
  QUEST_UPDATED = "QUEST_UPDATED",
  QUEST_FINISHED = "QUEST_FINISHED",
  LEVEL_UP = "LEVEL_UP",
  DEATH = "DEATH",
  SKILL_PROFICIENCY_ADDED = "SKILL_PROFICIENCY_ADDED",
  EXPERIENCE_GAINED = "EXPERIENCE_GAINED",
  DICE_ROLL = "DICE_ROLL",
}

/**
 * Base event interface
 */
export interface BaseEvent {
  id?: string;
  type: EventType;
  timestamp?: Date;
  actorId?: string;
  targetId?: string | undefined;
  sessionId?: string;
  campaignId?: string;
  payload?: Record<string, any>;
}

/**
 * Damage applied event
 */
export interface DamageAppliedEvent extends BaseEvent {
  type: EventType.DAMAGE_APPLIED;
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
  type: EventType.HEALING_RECEIVED;
  payload: {
    healing: number;
    source?: string;
  };
}

/**
 * Item given event
 */
export interface ItemGivenEvent extends BaseEvent {
  type: EventType.ITEM_GIVEN;
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
  type: EventType.SPELL_CAST;
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
  type: EventType.QUEST_UPDATED;
  payload: {
    questId: string;
    oldStatus?: string;
    newStatus: string;
    experienceReward?: number;
  };
}

/**
 * Quest finished event
 */
export interface QuestFinishedEvent extends BaseEvent {
  type: EventType.QUEST_FINISHED;
  payload: {
    questId: string;
    experienceReward: number;
    loot: any[];
  };
}

/**
 * Level up event
 */
export interface LevelUpEvent extends BaseEvent {
  type: EventType.LEVEL_UP;
  payload: {
    newLevel: number;
    oldLevel: number;
  };
}

/**
 * Death event
 */
export interface DeathEvent extends BaseEvent {
  type: EventType.DEATH;
  payload: {
    cause?: string;
  };
}

/**
 * Skill proficiency added event
 */
export interface SkillProficiencyAddedEvent extends BaseEvent {
  type: EventType.SKILL_PROFICIENCY_ADDED;
  payload: {
    skill: string;
    proficient: boolean;
    expertise: boolean;
  };
}

/**
 * Experience gained event
 */
export interface ExperienceGainedEvent extends BaseEvent {
  type: EventType.EXPERIENCE_GAINED;
  payload: {
    experienceGained: number;
    totalExperience: number;
  };
}

/**
 * Dice roll event
 */
export interface RollEvent extends BaseEvent {
  type: EventType.DICE_ROLL;
  payload: {
    notation: string;
    result: number;
    label?: string;
    characterId?: string;
    individualResults: number[];
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
  | QuestFinishedEvent
  | LevelUpEvent
  | DeathEvent
  | SkillProficiencyAddedEvent
  | ExperienceGainedEvent
  | RollEvent;

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
  campaignId?: string;
}
