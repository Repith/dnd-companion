import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { EventBusService } from "../../events/event-bus.service";
import { CharacterService } from "../../character/character.service";
import { InventoryService } from "../../inventory/inventory.service";
import { FinishQuestCommand } from "./finish-quest.command";
import { QuestFinishedDomainEvent } from "../events/quest-finished.event";
import { QuestStatus } from "../dto";
import {
  scaleQuestXP,
  calculateLootDistribution,
} from "../../../common/constants";

@Injectable()
@CommandHandler(FinishQuestCommand)
export class FinishQuestHandler implements ICommandHandler<FinishQuestCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly characterService: CharacterService,
    private readonly inventoryService: InventoryService,
  ) {}

  async execute(command: FinishQuestCommand): Promise<void> {
    const { questId, userId } = command;

    // Find the quest with participants
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
      include: {
        campaign: true,
        participants: {
          include: {
            character: {
              include: {
                abilityScores: true,
              },
            },
          },
        },
      },
    });

    if (!quest) {
      throw new NotFoundException("Quest not found");
    }

    // Check if user is DM of the campaign
    const isUserDM = quest.campaign.dmId === userId;
    if (!isUserDM) {
      throw new ForbiddenException("Only the DM can finish quests");
    }

    // Check if quest is in progress
    if (quest.status !== QuestStatus.IN_PROGRESS) {
      throw new ForbiddenException("Quest must be in progress to finish");
    }

    // Update quest status to COMPLETED
    await this.prisma.quest.update({
      where: { id: questId },
      data: { status: QuestStatus.COMPLETED },
    });

    // Get completed participants (those with COMPLETED status)
    const completedParticipants = quest.participants.filter(
      (p) => p.status === QuestStatus.COMPLETED && !p.rewardClaimed,
    );

    // Award XP and items to each completed participant
    for (const participant of completedParticipants) {
      const character = participant.character;

      // Scale XP based on character level and attributes
      const scaledXP = scaleQuestXP(
        quest.experienceReward,
        character.level,
        character.abilityScores,
      );

      // Award XP
      await this.prisma.character.update({
        where: { id: character.id },
        data: {
          experiencePoints: {
            increment: scaledXP,
          },
        },
      });

      // Grant items from loot with dynamic distribution
      if (quest.loot && Array.isArray(quest.loot)) {
        const characterInventory =
          await this.inventoryService.getCharacterInventory(character.id);

        const distributedLoot = calculateLootDistribution(
          quest.loot,
          character.level,
          character.abilityScores,
        );

        for (const lootItem of distributedLoot as any[]) {
          // Assuming loot is an array of { itemId: string, quantity: number }
          if (
            lootItem &&
            typeof lootItem === "object" &&
            lootItem.itemId &&
            lootItem.quantity
          ) {
            await this.inventoryService.addItem(
              characterInventory.id,
              { itemId: lootItem.itemId, quantity: lootItem.quantity },
              userId,
            );
          }
        }
      }

      // Mark reward as claimed
      await this.prisma.characterQuest.update({
        where: {
          characterId_questId: {
            characterId: character.id,
            questId,
          },
        },
        data: { rewardClaimed: true },
      });
    }

    // Publish QuestFinishedEvent
    const event = new QuestFinishedDomainEvent(
      questId,
      quest.experienceReward,
      Array.isArray(quest.loot) ? quest.loot : [],
      quest.campaignId,
      userId,
    );

    await this.eventBus.publish(event);
  }
}
