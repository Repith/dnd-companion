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
  QuestFinishedEvent,
  LevelUpEvent,
  DeathEvent,
  ExperienceGainedEvent,
  EventType,
  EventHandler,
} from "../dto";
import { HitPointsDto } from "../../character/dto/create-character.dto";
import { SkillProficiencyAddedDomainEvent } from "../../character/events/skill-proficiency-added.event";
import { QuestFinishedDomainEvent } from "../../quest/events/quest-finished.event";
import { ExperienceGainedDomainEvent } from "../../character/events/experience-gained.event";
import { LevelUpDomainEvent } from "../../character/events/level-up.event";
import { QuestStatus } from "../../quest/dto";

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

    if (!event.targetId) {
      this.logger.warn("HealingReceivedEvent missing targetId");
      return;
    }

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
      const maxHP = hitPoints.max;
      const newHP = Math.min(maxHP, currentHP + event.payload.healing);

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

      this.logger.log(
        `Applied ${event.payload.healing} healing to ${event.targetId}, HP: ${currentHP} -> ${newHP}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process healing for ${event.targetId}:`,
        error,
      );
    }
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

    if (!event.payload.toInventoryId) {
      this.logger.warn("ItemGivenEvent missing toInventoryId");
      return;
    }

    try {
      // Check if item exists
      const item = await this.prisma.item.findUnique({
        where: { id: event.payload.itemId },
      });

      if (!item) {
        this.logger.warn(`Item ${event.payload.itemId} not found`);
        return;
      }

      // If transferring from another inventory
      if (event.payload.fromInventoryId) {
        // Remove from source inventory
        const sourceItem = await this.prisma.inventoryItem.findFirst({
          where: {
            inventoryId: event.payload.fromInventoryId,
            itemId: event.payload.itemId,
          },
        });

        if (sourceItem) {
          const newQuantity = sourceItem.quantity - event.payload.quantity;
          if (newQuantity <= 0) {
            // Remove item completely
            await this.prisma.inventoryItem.delete({
              where: { id: sourceItem.id },
            });
          } else {
            // Reduce quantity
            await this.prisma.inventoryItem.update({
              where: { id: sourceItem.id },
              data: { quantity: newQuantity },
            });
          }
        }
      }

      // Add to destination inventory
      const existingItem = await this.prisma.inventoryItem.findFirst({
        where: {
          inventoryId: event.payload.toInventoryId,
          itemId: event.payload.itemId,
        },
      });

      if (existingItem) {
        // Update quantity
        await this.prisma.inventoryItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + event.payload.quantity,
          },
        });
      } else {
        // Create new inventory item
        await this.prisma.inventoryItem.create({
          data: {
            inventoryId: event.payload.toInventoryId,
            itemId: event.payload.itemId,
            quantity: event.payload.quantity,
          },
        });
      }

      this.logger.log(
        `Transferred ${event.payload.quantity} of item ${event.payload.itemId} to inventory ${event.payload.toInventoryId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process item transfer for ${event.payload.itemId}:`,
        error,
      );
    }
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

    if (!event.actorId) {
      this.logger.warn("SpellCastEvent missing actorId");
      return;
    }

    try {
      // Get character spellcasting data
      const character = await this.prisma.character.findUnique({
        where: { id: event.actorId },
        select: { spellcasting: true },
      });

      if (!character || !character.spellcasting) {
        this.logger.warn(
          `Character ${event.actorId} not found or has no spellcasting data`,
        );
        return;
      }

      const spellcasting = character.spellcasting as any;
      const spellLevel = event.payload.spellLevel || 0;

      // Check if character has remaining slots for this level
      if (
        spellcasting.remainingSlots &&
        spellcasting.remainingSlots[spellLevel] > 0
      ) {
        // Decrement remaining slots
        spellcasting.remainingSlots[spellLevel] -= 1;

        // Update character
        await this.prisma.character.update({
          where: { id: event.actorId },
          data: {
            spellcasting: spellcasting,
          },
        });

        this.logger.log(
          `Spell ${event.payload.spellId} cast by ${event.actorId}, level ${spellLevel} slots remaining: ${spellcasting.remainingSlots[spellLevel]}`,
        );
      } else {
        this.logger.warn(
          `Character ${event.actorId} has no remaining slots for level ${spellLevel}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to process spell cast for ${event.payload.spellId}:`,
        error,
      );
    }
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

    try {
      // Update quest status
      await this.prisma.quest.update({
        where: { id: event.payload.questId },
        data: { status: event.payload.newStatus as QuestStatus },
      });

      // If quest is completed, award experience to participants
      if (
        event.payload.newStatus === "COMPLETED" &&
        event.payload.experienceReward
      ) {
        // Get quest participants
        const quest = await this.prisma.quest.findUnique({
          where: { id: event.payload.questId },
          include: {
            participants: {
              where: { status: "COMPLETED", rewardClaimed: false },
              include: { character: true },
            },
          },
        });

        if (quest) {
          for (const participant of quest.participants) {
            // Update character experience
            const character = await this.prisma.character.findUnique({
              where: { id: participant.characterId },
              select: { experiencePoints: true },
            });

            if (character) {
              const oldExperience = character.experiencePoints;

              await this.prisma.character.update({
                where: { id: participant.characterId },
                data: {
                  experiencePoints:
                    oldExperience + event.payload.experienceReward,
                },
              });

              // Mark reward as claimed
              await this.prisma.characterQuest.update({
                where: {
                  characterId_questId: {
                    characterId: participant.characterId,
                    questId: event.payload.questId,
                  },
                },
                data: { rewardClaimed: true },
              });

              // Publish experience gained event
              const experienceEvent: ExperienceGainedEvent = {
                type: EventType.EXPERIENCE_GAINED,
                targetId: participant.characterId,
                payload: {
                  experienceGained: event.payload.experienceReward,
                  totalExperience:
                    oldExperience + event.payload.experienceReward,
                },
                ...(event.sessionId && { sessionId: event.sessionId }),
                ...(event.campaignId && { campaignId: event.campaignId }),
                ...(event.global !== undefined && { global: event.global }),
              };
              await this.eventBus.publish(experienceEvent);
            }
          }
        }
      }

      this.logger.log(
        `Quest ${event.payload.questId} updated to ${event.payload.newStatus}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process quest update for ${event.payload.questId}:`,
        error,
      );
    }
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

    if (!event.targetId) {
      this.logger.warn("LevelUpEvent missing targetId");
      return;
    }

    try {
      // Update character level
      await this.prisma.character.update({
        where: { id: event.targetId },
        data: { level: event.payload.newLevel },
      });

      // Recalculate proficiency bonus (DnD 5e: +2 at level 1-4, +3 at 5-8, +4 at 9-12, +5 at 13-16, +6 at 17+)
      const proficiencyBonus = Math.floor((event.payload.newLevel - 1) / 4) + 2;

      await this.prisma.character.update({
        where: { id: event.targetId },
        data: { proficiencyBonus },
      });

      this.logger.log(
        `Character ${event.targetId} leveled up to ${event.payload.newLevel}, proficiency bonus: ${proficiencyBonus}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process level up for ${event.targetId}:`,
        error,
      );
    }
  }
}

/**
 * Handler for experience gained events
 */
@Injectable()
export class GameEventExperienceGainedHandler extends BaseEventHandler {
  constructor(eventBus: EventBusService, prisma: PrismaService) {
    super(eventBus, prisma);
    this.registerHandler(
      EventType.EXPERIENCE_GAINED,
      this.handleExperienceGained.bind(this),
    );
  }

  private async handleExperienceGained(
    event: ExperienceGainedEvent,
  ): Promise<void> {
    this.logger.debug(
      `Processing experience gained: ${event.payload.experienceGained} for ${event.targetId}`,
    );

    if (!event.targetId) {
      this.logger.warn("ExperienceGainedEvent missing targetId");
      return;
    }

    try {
      // Update character experience (already done by the source, but ensure consistency)
      await this.prisma.character.update({
        where: { id: event.targetId },
        data: {
          experiencePoints: event.payload.totalExperience,
        },
      });

      // Check for level up
      const character = await this.prisma.character.findUnique({
        where: { id: event.targetId },
        select: { level: true, experiencePoints: true },
      });

      if (character) {
        // Calculate new level based on experience (simplified XP table)
        const xpTable = [
          0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000,
          100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000,
          355000,
        ];
        let newLevel = 1;
        for (let i = 0; i < xpTable.length; i++) {
          if (character.experiencePoints >= xpTable[i]) {
            newLevel = i + 1;
          } else {
            break;
          }
        }

        if (newLevel > character.level) {
          // Trigger level up event
          const levelUpEvent: LevelUpEvent = {
            type: EventType.LEVEL_UP,
            targetId: event.targetId,
            payload: {
              oldLevel: character.level,
              newLevel: newLevel,
            },
            ...(event.sessionId && { sessionId: event.sessionId }),
            ...(event.campaignId && { campaignId: event.campaignId }),
            ...(event.global !== undefined && { global: event.global }),
          };
          await this.eventBus.publish(levelUpEvent);
        }
      }

      this.logger.log(
        `Character ${event.targetId} gained ${event.payload.experienceGained} XP, total: ${event.payload.totalExperience}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process experience gain for ${event.targetId}:`,
        error,
      );
    }
  }
}

/**
 * Handler for quest finished events
 */
@Injectable()
export class GameEventQuestFinishedHandler extends BaseEventHandler {
  constructor(eventBus: EventBusService, prisma: PrismaService) {
    super(eventBus, prisma);
    this.registerHandler(
      EventType.QUEST_FINISHED,
      this.handleQuestFinished.bind(this),
    );
  }

  private async handleQuestFinished(event: QuestFinishedEvent): Promise<void> {
    this.logger.debug(`Processing quest finished: ${event.payload.questId}`);

    // Quest finished logic is handled by QuestEventHandler when status changes to COMPLETED
    // This handler can be used for additional side effects if needed

    this.logger.log(`Quest ${event.payload.questId} has been completed`);
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

    if (!event.targetId) {
      this.logger.warn("DeathEvent missing targetId");
      return;
    }

    try {
      // Mark character as dead
      await this.prisma.character.update({
        where: { id: event.targetId },
        data: { isDead: true },
      });

      // If there was an actor (killer), award experience
      if (event.actorId && event.actorId !== event.targetId) {
        const killer = await this.prisma.character.findUnique({
          where: { id: event.actorId },
          select: { experiencePoints: true, level: true },
        });

        if (killer) {
          // Award experience based on level difference (simplified)
          const experienceAward = Math.max(10, killer.level * 50);

          await this.prisma.character.update({
            where: { id: event.actorId },
            data: {
              experiencePoints: killer.experiencePoints + experienceAward,
            },
          });

          // Publish experience gained event for killer
          const experienceEvent: ExperienceGainedEvent = {
            type: EventType.EXPERIENCE_GAINED,
            targetId: event.actorId,
            payload: {
              experienceGained: experienceAward,
              totalExperience: killer.experiencePoints + experienceAward,
            },
            ...(event.sessionId && { sessionId: event.sessionId }),
            ...(event.campaignId && { campaignId: event.campaignId }),
            ...(event.global !== undefined && { global: event.global }),
          };
          await this.eventBus.publish(experienceEvent);

          this.logger.log(
            `Awarded ${experienceAward} XP to killer ${event.actorId} for defeating ${event.targetId}`,
          );
        }
      }

      this.logger.log(`Character ${event.targetId} has died`);
    } catch (error) {
      this.logger.error(
        `Failed to process death for ${event.targetId}:`,
        error,
      );
    }
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
