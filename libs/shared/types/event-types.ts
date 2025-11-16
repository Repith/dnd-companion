/**
 * Standardized event types for DnD Companion
 * Shared between backend and frontend
 */
export enum EventType {
  // Session events
  SESSION_CREATED = "SESSION_CREATED",
  SESSION_UPDATED = "SESSION_UPDATED",
  SESSION_DELETED = "SESSION_DELETED",
  COMBAT_STARTED = "COMBAT_STARTED",
  COMBAT_ENDED = "COMBAT_ENDED",

  // Dice rolls
  DICE_ROLL = "DICE_ROLL",
  CHECK_ROLL = "CHECK_ROLL",

  // Character events
  CHARACTER_CREATED = "CHARACTER_CREATED",
  CHARACTER_UPDATED = "CHARACTER_UPDATED",
  CHARACTER_DELETED = "CHARACTER_DELETED",
  DAMAGE_APPLIED = "DAMAGE_APPLIED",
  HEALING_RECEIVED = "HEALING_RECEIVED",
  TEMP_HP_GAINED = "TEMP_HP_GAINED",
  DEATH = "DEATH",
  LEVEL_UP = "LEVEL_UP",
  EXPERIENCE_GAINED = "EXPERIENCE_GAINED",
  SKILL_PROFICIENCY_ADDED = "SKILL_PROFICIENCY_ADDED",
  ABILITY_SCORE_UPDATED = "ABILITY_SCORE_UPDATED",
  SAVING_THROW_PROFICIENCY_UPDATED = "SAVING_THROW_PROFICIENCY_UPDATED",

  // Spell events
  SPELL_CAST = "SPELL_CAST",
  SPELL_LEARNT = "SPELL_LEARNT",
  SPELL_PREPARED = "SPELL_PREPARED",
  SPELL_UNPREPARED = "SPELL_UNPREPARED",

  // Inventory events
  ITEM_GIVEN = "ITEM_GIVEN",
  ITEM_USED = "ITEM_USED",
  ITEM_EQUIPPED = "ITEM_EQUIPPED",
  ITEM_UNEQUIPPED = "ITEM_UNEQUIPPED",

  // Quest and campaign events
  QUEST_CREATED = "QUEST_CREATED",
  QUEST_UPDATED = "QUEST_UPDATED",
  QUEST_FINISHED = "QUEST_FINISHED",
  QUEST_REWARD_CLAIMED = "QUEST_REWARD_CLAIMED",
  CAMPAIGN_CREATED = "CAMPAIGN_CREATED",
  CAMPAIGN_UPDATED = "CAMPAIGN_UPDATED",

  // Note events
  NOTE_ADDED = "NOTE_ADDED",
  NOTE_UPDATED = "NOTE_UPDATED",
  NOTE_DELETED = "NOTE_DELETED",

  // System events
  USER_LOGGED_IN = "USER_LOGGED_IN",
  USER_LOGGED_OUT = "USER_LOGGED_OUT",
  ERROR_OCCURRED = "ERROR_OCCURRED",
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
  global?: boolean;
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
 * Ability score updated event
 */
export interface AbilityScoreUpdatedEvent extends BaseEvent {
  type: EventType.ABILITY_SCORE_UPDATED;
  payload: {
    ability: string;
    oldScore: number;
    newScore: number;
    modifierChange: number;
  };
}

/**
 * Saving throw proficiency updated event
 */
export interface SavingThrowProficiencyUpdatedEvent extends BaseEvent {
  type: EventType.SAVING_THROW_PROFICIENCY_UPDATED;
  payload: {
    ability: string;
    proficient: boolean;
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
 * Check roll event
 */
export interface CheckRollEvent extends BaseEvent {
  type: EventType.CHECK_ROLL;
  payload: {
    abilityOrSkill: string;
    dc: number;
    success: boolean;
  };
}

/**
 * Session created event
 */
export interface SessionCreatedEvent extends BaseEvent {
  type: EventType.SESSION_CREATED;
  payload: {
    sessionId: string;
    date: Date;
    description?: string;
  };
}

/**
 * Session updated event
 */
export interface SessionUpdatedEvent extends BaseEvent {
  type: EventType.SESSION_UPDATED;
  payload: {
    sessionId: string;
    changes: Partial<{
      date: Date;
      name: string;
      description: string;
    }>;
  };
}

/**
 * Session deleted event
 */
export interface SessionDeletedEvent extends BaseEvent {
  type: EventType.SESSION_DELETED;
  payload: {
    sessionId: string;
  };
}

/**
 * Combat started event
 */
export interface CombatStartedEvent extends BaseEvent {
  type: EventType.COMBAT_STARTED;
  payload: {
    encounterId: string;
    initiativeOrder?: string[];
  };
}

/**
 * Combat ended event
 */
export interface CombatEndedEvent extends BaseEvent {
  type: EventType.COMBAT_ENDED;
  payload: {
    encounterId: string;
    result: "victory" | "defeat" | "retreat" | "other";
  };
}

/**
 * Character created event
 */
export interface CharacterCreatedEvent extends BaseEvent {
  type: EventType.CHARACTER_CREATED;
  payload: {
    characterId: string;
    name: string;
    characterClass: string;
    race: string;
  };
}

/**
 * Character updated event
 */
export interface CharacterUpdatedEvent extends BaseEvent {
  type: EventType.CHARACTER_UPDATED;
  payload: {
    characterId: string;
    changes: Record<string, any>;
  };
}

/**
 * Character deleted event
 */
export interface CharacterDeletedEvent extends BaseEvent {
  type: EventType.CHARACTER_DELETED;
  payload: {
    characterId: string;
  };
}

/**
 * Temporary HP gained event
 */
export interface TempHPGainedEvent extends BaseEvent {
  type: EventType.TEMP_HP_GAINED;
  payload: {
    tempHP: number;
    source?: string;
  };
}

/**
 * Spell learnt event
 */
export interface SpellLearntEvent extends BaseEvent {
  type: EventType.SPELL_LEARNT;
  payload: {
    spellId: string;
    spellLevel?: number;
  };
}

/**
 * Spell prepared event
 */
export interface SpellPreparedEvent extends BaseEvent {
  type: EventType.SPELL_PREPARED;
  payload: {
    spellId: string;
    prepared: boolean;
  };
}

/**
 * Spell unprepared event
 */
export interface SpellUnpreparedEvent extends BaseEvent {
  type: EventType.SPELL_UNPREPARED;
  payload: {
    spellId: string;
  };
}

/**
 * Item used event
 */
export interface ItemUsedEvent extends BaseEvent {
  type: EventType.ITEM_USED;
  payload: {
    itemId: string;
    quantity?: number;
    effect?: string;
  };
}

/**
 * Item equipped event
 */
export interface ItemEquippedEvent extends BaseEvent {
  type: EventType.ITEM_EQUIPPED;
  payload: {
    itemId: string;
    slot: string;
  };
}

/**
 * Item unequipped event
 */
export interface ItemUnequippedEvent extends BaseEvent {
  type: EventType.ITEM_UNEQUIPPED;
  payload: {
    itemId: string;
    slot: string;
  };
}

/**
 * Quest created event
 */
export interface QuestCreatedEvent extends BaseEvent {
  type: EventType.QUEST_CREATED;
  payload: {
    questId: string;
    name: string;
    status: "active" | "completed" | "failed" | "on_hold";
  };
}

/**
 * Quest reward claimed event
 */
export interface QuestRewardClaimedEvent extends BaseEvent {
  type: EventType.QUEST_REWARD_CLAIMED;
  payload: {
    questId: string;
    characterId: string;
    experience: number;
    items: any[];
  };
}

/**
 * Campaign created event
 */
export interface CampaignCreatedEvent extends BaseEvent {
  type: EventType.CAMPAIGN_CREATED;
  payload: {
    campaignId: string;
    name: string;
    description?: string;
  };
}

/**
 * Campaign updated event
 */
export interface CampaignUpdatedEvent extends BaseEvent {
  type: EventType.CAMPAIGN_UPDATED;
  payload: {
    campaignId: string;
    changes: Partial<{
      name: string;
      description: string;
    }>;
  };
}

/**
 * Note added event
 */
export interface NoteAddedEvent extends BaseEvent {
  type: EventType.NOTE_ADDED;
  payload: {
    noteId: string;
    scope: "DM" | "public" | "private";
    contentPreview: string;
  };
}

/**
 * Note updated event
 */
export interface NoteUpdatedEvent extends BaseEvent {
  type: EventType.NOTE_UPDATED;
  payload: {
    noteId: string;
    changes: Partial<{
      content: string;
      scope: "DM" | "public" | "private";
    }>;
  };
}

/**
 * Note deleted event
 */
export interface NoteDeletedEvent extends BaseEvent {
  type: EventType.NOTE_DELETED;
  payload: {
    noteId: string;
  };
}

/**
 * User logged in event
 */
export interface UserLoggedInEvent extends BaseEvent {
  type: EventType.USER_LOGGED_IN;
  payload: {
    userId: string;
    username: string;
    email: string;
  };
}

/**
 * User logged out event
 */
export interface UserLoggedOutEvent extends BaseEvent {
  type: EventType.USER_LOGGED_OUT;
  payload: {
    userId: string;
    username: string;
    email: string;
  };
}

/**
 * Error occurred event
 */
export interface ErrorOccurredEvent extends BaseEvent {
  type: EventType.ERROR_OCCURRED;
  payload: {
    error: string;
    stack?: string;
    context?: Record<string, any>;
  };
}

/**
 * Union type of all game events
 */
export type GameEvent =
  // Session events
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | SessionDeletedEvent
  | CombatStartedEvent
  | CombatEndedEvent

  // Dice roll events
  | RollEvent
  | CheckRollEvent

  // Character events
  | CharacterCreatedEvent
  | CharacterUpdatedEvent
  | CharacterDeletedEvent
  | DamageAppliedEvent
  | HealingReceivedEvent
  | TempHPGainedEvent
  | DeathEvent
  | LevelUpEvent
  | ExperienceGainedEvent
  | SkillProficiencyAddedEvent
  | AbilityScoreUpdatedEvent
  | SavingThrowProficiencyUpdatedEvent

  // Spell events
  | SpellCastEvent
  | SpellLearntEvent
  | SpellPreparedEvent
  | SpellUnpreparedEvent

  // Inventory events
  | ItemGivenEvent
  | ItemUsedEvent
  | ItemEquippedEvent
  | ItemUnequippedEvent

  // Quest and campaign events
  | QuestCreatedEvent
  | QuestUpdatedEvent
  | QuestFinishedEvent
  | QuestRewardClaimedEvent
  | CampaignCreatedEvent
  | CampaignUpdatedEvent

  // Note events
  | NoteAddedEvent
  | NoteUpdatedEvent
  | NoteDeletedEvent

  // System events
  | UserLoggedInEvent
  | UserLoggedOutEvent
  | ErrorOccurredEvent;

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
  global?: boolean;
}
