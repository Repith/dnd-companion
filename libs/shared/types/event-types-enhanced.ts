/**
 * Enhanced event types for DnD Companion - Ability System
 * Add these new event types to the existing event-types.ts file
 */

// New Event Types to Add to EventType Enum:
const NEW_EVENT_TYPES = `
  ABILITY_SCORE_UPDATED = "ABILITY_SCORE_UPDATED",
  SAVING_THROW_PROFICIENCY_UPDATED = "SAVING_THROW_PROFICIENCY_UPDATED",
`;

// New Event Interfaces to Add:
const NEW_EVENT_INTERFACES = `

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
`;

const UPDATED_GAME_EVENTS_TYPE = `

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
`;

// Instructions for updating the original file:
export const EVENT_TYPES_ENHANCEMENT_INSTRUCTIONS = {
  addToEventTypeEnum: NEW_EVENT_TYPES,
  addNewEventInterfaces: NEW_EVENT_INTERFACES,
  updateGameEventsUnion: UPDATED_GAME_EVENTS_TYPE,
  fileToUpdate: "libs/shared/types/event-types.ts",
};
