import { Injectable, Logger } from "@nestjs/common";
import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { EventBusService } from "../event-bus.service";
import { PrismaService } from "../../../common/prisma/prisma.service";
import {
  DamageAppliedEvent,
  HealingReceivedEvent,
  ItemGivenEvent,
  SpellCastEvent,
  QuestUpdatedEvent,
  LevelUpEvent,
  DeathEvent,
  EventType,
  EventHandler,
} from "../dto";
import { HitPointsDto } from "../../character/dto/create-character.dto";
import { SkillProficiencyAddedDomainEvent } from "../../character/events/skill-proficiency-added.event";
import { QuestFinishedDomainEvent } from "../../quest/events/quest-finished.event";
import { ExperienceGainedDomainEvent } from "../../character/events/experience-gained.event";
import { LevelUpDomainEvent } from "../../character/events/level-up.event";

/**
 * Base class for event handlers
 * Provides common functionality and logging
 */
@Injectable()
export abstract class BaseEventHandler {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly eventBus: EventBusService,
    protected readonly prisma: PrismaService,
  ) {}

  /**
   * Register this handler with the event bus
   */
  protected registerHandler<T extends EventType>(
    eventType: T,
    handler: EventHandler<any>,
  ): void {
    this.eventBus.subscribe(eventType, handler);
    this.logger.log(`Registered handler for event type: ${eventType}`);
  }
}

/**
 * Handler for damage applied events
 */
@Injectable()
export class DamageEventHandler extends BaseEventHandler {
  constructor(eventBus: EventBusService, prisma: PrismaService) {
    super(eventBus, prisma);
    this.registerHandler(
      EventType.DAMAGE_APPLIED,
      this.handleDamageApplied.bind(this),
    );
  }

  private async handleDamageApplied(event: DamageAppliedEvent): Promise<void> {
    this.logger.debug(
      `Processing damage applied: ${event.payload.damage} to ${event.targetId}`,
    );

    if (!event.targetId) {
      this.logger.warn("DamageAppliedEvent missing targetId");
      return;
    }

    // Use injected prisma service

    try {
      // Get character current HP
      const character = await this.prisma.character.findUnique({
        where: { id: event.targetId },
        select: { hitPoints: true, level: true },
      });

      if (!character || !character.hitPoints) {
        this.logger.warn(
          `Character ${event.targetId} not found or has no HP data`,
        );
        return;
      }

      const hitPoints = character.hitPoints as unknown as HitPointsDto;
      const currentHP = hitPoints.current;
      const newHP = Math.max(0, currentHP - event.payload.damage);

      // Update character HP
      await this.prisma.character.update({
        where: { id: event.targetId },
        data: {
          hitPoints: {
            max: hitPoints.max,
            current: newHP,
            temporary: hitPoints.temporary,
          },
        },
      });

      // Check for death
      if (newHP <= 0) {
        const deathEvent: DeathEvent = {
          type: EventType.DEATH,
          targetId: event.targetId,
          payload: {
            cause: "damage",
          },
          sessionId: event.sessionId || "default-session",
        };
        await this.eventBus.publish(deathEvent);
      }

      this.logger.log(
        `Applied ${event.payload.damage} damage to ${event.targetId}, HP: ${currentHP} -> ${newHP}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process damage for ${event.targetId}:`,
        error,
      );
    }
  }
}

/**
 * Handler for healing received events
 */
@Injectable()
export class HealingEventHandler extends BaseEventHandler {
  constructor(eventBus: EventBusService, prisma: PrismaService) {
    super(eventBus, prisma);
    this.registerHandler(
      EventType.HEALING_RECEIVED,
      this.handleHealingReceived.bind(this),
    );
  }

  private async handleHealingReceived(
    event: HealingReceivedEvent,
  ): Promise<void> {
    this.logger.debug(
      `Processing healing received: ${event.payload.healing} to ${event.targetId}`,
    );

    // TODO: Implement healing processing logic
    // - Update character HP
    // - Check for max HP limits
    // - Trigger additional events
  }
}

/**
 * Handler for item given events
 */
@Injectable()
export class ItemEventHandler extends BaseEventHandler {
  constructor(eventBus: EventBusService, prisma: PrismaService) {
    super(eventBus, prisma);
    this.registerHandler(EventType.ITEM_GIVEN, this.handleItemGiven.bind(this));
  }

  private async handleItemGiven(event: ItemGivenEvent): Promise<void> {
    this.logger.debug(
      `Processing item given: ${event.payload.itemId} to ${event.targetId}`,
    );

    // TODO: Implement item transfer logic
    // - Update inventory
    // - Check weight limits
    // - Trigger additional events
  }
}

/**
 * Handler for spell cast events
 */
@Injectable()
export class SpellEventHandler extends BaseEventHandler {
  constructor(eventBus: EventBusService, prisma: PrismaService) {
    super(eventBus, prisma);
    this.registerHandler(EventType.SPELL_CAST, this.handleSpellCast.bind(this));
  }

  private async handleSpellCast(event: SpellCastEvent): Promise<void> {
    this.logger.debug(
      `Processing spell cast: ${event.payload.spellId} by ${event.actorId}`,
    );

    // TODO: Implement spell casting logic
    // - Update spell slots
    // - Apply spell effects
    // - Trigger additional events
  }
}

/**
 * Handler for quest updated events
 */
@Injectable()
export class QuestEventHandler extends BaseEventHandler {
  constructor(eventBus: EventBusService, prisma: PrismaService) {
    super(eventBus, prisma);
    this.registerHandler(
      EventType.QUEST_UPDATED,
      this.handleQuestUpdated.bind(this),
    );
  }

  private async handleQuestUpdated(event: QuestUpdatedEvent): Promise<void> {
    this.logger.debug(
      `Processing quest updated: ${event.payload.questId} to ${event.payload.newStatus}`,
    );

    // TODO: Implement quest update logic
    // - Update quest status
    // - Award experience/XP
    // - Trigger additional events
  }
}

/**
 * Handler for level up events
 */
@Injectable()
export class LevelUpEventHandler extends BaseEventHandler {
  constructor(eventBus: EventBusService, prisma: PrismaService) {
    super(eventBus, prisma);
    this.registerHandler(EventType.LEVEL_UP, this.handleLevelUp.bind(this));
  }

  private async handleLevelUp(event: LevelUpEvent): Promise<void> {
    this.logger.debug(
      `Processing level up: ${event.actorId} from ${event.payload.oldLevel} to ${event.payload.newLevel}`,
    );

    // TODO: Implement level up logic
    // - Update character level
    // - Recalculate stats
    // - Trigger additional events
  }
}

/**
 * Handler for death events
 */
@Injectable()
export class DeathEventHandler extends BaseEventHandler {
  constructor(eventBus: EventBusService, prisma: PrismaService) {
    super(eventBus, prisma);
    this.registerHandler(EventType.DEATH, this.handleDeath.bind(this));
  }

  private async handleDeath(event: DeathEvent): Promise<void> {
    this.logger.debug(`Processing death: ${event.targetId}`);

    // TODO: Implement death logic
    // - Mark character as dead
    // - Trigger respawn mechanics
    // - Award experience to killer
  }
}

/**
 * Handler for CQRS SkillProficiencyAdded domain events
 */
@Injectable()
@EventsHandler(SkillProficiencyAddedDomainEvent)
export class SkillProficiencyAddedEventHandler
  implements IEventHandler<SkillProficiencyAddedDomainEvent>
{
  private readonly logger = new Logger(SkillProficiencyAddedEventHandler.name);

  constructor(private readonly eventBus: EventBusService) {}

  async handle(event: SkillProficiencyAddedDomainEvent): Promise<void> {
    this.logger.debug(
      `Handling domain event: SkillProficiencyAdded for character ${event.targetId}`,
    );

    // Map domain event to GameEvent and publish
    await this.eventBus.publish(event);
  }
}

/**
 * Handler for CQRS QuestFinished domain events
 */
@Injectable()
@EventsHandler(QuestFinishedDomainEvent)
export class QuestFinishedEventHandler
  implements IEventHandler<QuestFinishedDomainEvent>
{
  private readonly logger = new Logger(QuestFinishedEventHandler.name);

  constructor(private readonly eventBus: EventBusService) {}

  async handle(event: QuestFinishedDomainEvent): Promise<void> {
    this.logger.debug(
      `Handling domain event: QuestFinished for quest ${event.targetId}`,
    );

    // Map domain event to GameEvent and publish
    await this.eventBus.publish(event);
  }
}

/**
 * Handler for CQRS ExperienceGained domain events
 */
@Injectable()
@EventsHandler(ExperienceGainedDomainEvent)
export class ExperienceGainedEventHandler
  implements IEventHandler<ExperienceGainedDomainEvent>
{
  private readonly logger = new Logger(ExperienceGainedEventHandler.name);

  constructor(private readonly eventBus: EventBusService) {}

  async handle(event: ExperienceGainedDomainEvent): Promise<void> {
    this.logger.debug(
      `Handling domain event: ExperienceGained for character ${event.targetId}`,
    );

    // Map domain event to GameEvent and publish
    await this.eventBus.publish(event);
  }
}

/**
 * Handler for CQRS LevelUp domain events
 */
@Injectable()
@EventsHandler(LevelUpDomainEvent)
export class LevelUpDomainEventHandler
  implements IEventHandler<LevelUpDomainEvent>
{
  private readonly logger = new Logger(LevelUpDomainEventHandler.name);

  constructor(private readonly eventBus: EventBusService) {}

  async handle(event: LevelUpDomainEvent): Promise<void> {
    this.logger.debug(
      `Handling domain event: LevelUp for character ${event.targetId}`,
    );

    // Map domain event to GameEvent and publish
    await this.eventBus.publish(event);
  }
}
