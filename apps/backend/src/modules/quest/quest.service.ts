import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { EventBusService } from "../events/event-bus.service";
import {
  CreateQuestDto,
  UpdateQuestDto,
  QuestResponseDto,
  QuestStatus,
} from "./dto";
import { CampaignService } from "../campaign/campaign.service";
import {
  EventType,
  QuestUpdatedEvent,
  ExperienceGainedEvent,
  QuestFinishedEvent,
} from "../events/dto";

@Injectable()
export class QuestService {
  constructor(
    private prisma: PrismaService,
    private campaignService: CampaignService,
    private eventBus: EventBusService,
  ) {}

  async create(
    createDto: CreateQuestDto,
    campaignId: string,
    userId: string,
  ): Promise<QuestResponseDto> {
    const isUserDM = await this.campaignService.isUserDM(campaignId, userId);
    if (!isUserDM) {
      throw new ForbiddenException("Only the DM can create quests");
    }

    const quest = await this.prisma.quest.create({
      data: {
        ...createDto,
        campaignId,
      },
    });

    return new QuestResponseDto(quest);
  }

  async findAll(
    campaignId: string,
    userId: string,
  ): Promise<QuestResponseDto[]> {
    const isUserInCampaign = await this.campaignService.isUserInCampaign(
      campaignId,
      userId,
    );
    if (!isUserInCampaign) {
      throw new ForbiddenException("You are not part of this campaign");
    }

    const quests = await this.prisma.quest.findMany({
      where: { campaignId },
      orderBy: { createdAt: "desc" },
    });

    return quests.map((quest: QuestResponseDto) => new QuestResponseDto(quest));
  }

  async findById(id: string, userId: string): Promise<QuestResponseDto | null> {
    const quest = await this.prisma.quest.findUnique({
      where: { id },
      include: {
        campaign: true,
        participants: {
          include: {
            character: true,
          },
        },
        locations: true,
      },
    });

    if (!quest) {
      return null;
    }

    const isUserInCampaign = await this.campaignService.isUserInCampaign(
      quest.campaignId,
      userId,
    );
    if (!isUserInCampaign) {
      throw new ForbiddenException("You are not part of this campaign");
    }

    return new QuestResponseDto(quest);
  }

  async update(
    id: string,
    updateDto: UpdateQuestDto,
    userId: string,
  ): Promise<QuestResponseDto> {
    const quest = await this.prisma.quest.findUnique({
      where: { id },
      include: { campaign: true },
    });

    if (!quest) {
      throw new NotFoundException("Quest not found");
    }

    const isUserDM = await this.campaignService.isUserDM(
      quest.campaignId,
      userId,
    );
    if (!isUserDM) {
      throw new ForbiddenException("Only the DM can update quests");
    }

    const updatedQuest = await this.prisma.quest.update({
      where: { id },
      data: updateDto,
    });

    // Publish quest updated event if status changed
    if (updateDto.status && updateDto.status !== quest.status) {
      const questEvent: QuestUpdatedEvent = {
        type: EventType.QUEST_UPDATED,
        actorId: userId,
        payload: {
          questId: id,
          oldStatus: quest.status,
          newStatus: updateDto.status,
          experienceReward: quest.experienceReward,
        },
        sessionId: quest.campaignId,
      };
      await this.eventBus.publish(questEvent);
    }

    return new QuestResponseDto(updatedQuest);
  }

  async delete(id: string, userId: string): Promise<void> {
    const quest = await this.prisma.quest.findUnique({
      where: { id },
      include: { campaign: true },
    });

    if (!quest) {
      throw new NotFoundException("Quest not found");
    }

    const isUserDM = await this.campaignService.isUserDM(
      quest.campaignId,
      userId,
    );
    if (!isUserDM) {
      throw new ForbiddenException("Only the DM can delete quests");
    }

    await this.prisma.quest.delete({
      where: { id },
    });
  }

  async updateProgress(
    questId: string,
    characterId: string,
    status: QuestStatus,
    userId: string,
  ): Promise<void> {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
      include: { campaign: true },
    });

    if (!quest) {
      throw new NotFoundException("Quest not found");
    }

    const isUserInCampaign = await this.campaignService.isUserInCampaign(
      quest.campaignId,
      userId,
    );
    if (!isUserInCampaign) {
      throw new ForbiddenException("You are not part of this campaign");
    }

    // Check if character belongs to user or if user is DM
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new NotFoundException("Character not found");
    }

    const isUserDM = await this.campaignService.isUserDM(
      quest.campaignId,
      userId,
    );
    if (character.ownerId !== userId && !isUserDM) {
      throw new ForbiddenException(
        "You can only update progress for your own characters",
      );
    }

    await this.prisma.characterQuest.upsert({
      where: {
        characterId_questId: {
          characterId,
          questId,
        },
      },
      update: { status },
      create: {
        characterId,
        questId,
        status,
      },
    });
  }

  async awardRewards(questId: string, userId: string): Promise<void> {
    const quest = await this.prisma.quest.findUnique({
      where: { id: questId },
      include: {
        campaign: true,
        participants: {
          include: {
            character: true,
          },
        },
      },
    });

    if (!quest) {
      throw new NotFoundException("Quest not found");
    }

    const isUserDM = await this.campaignService.isUserDM(
      quest.campaignId,
      userId,
    );
    if (!isUserDM) {
      throw new ForbiddenException("Only the DM can award quest rewards");
    }

    // Award experience to completed participants
    const completedParticipants = quest.participants.filter(
      (p) => p.status === QuestStatus.COMPLETED && !p.rewardClaimed,
    );

    for (const participant of completedParticipants) {
      // Get current experience before update
      const character = await this.prisma.character.findUnique({
        where: { id: participant.characterId },
        select: { experiencePoints: true },
      });

      if (!character) continue;

      const oldExperience = character.experiencePoints;

      await this.prisma.character.update({
        where: { id: participant.characterId },
        data: {
          experiencePoints: {
            increment: quest.experienceReward,
          },
        },
      });

      await this.prisma.characterQuest.update({
        where: {
          characterId_questId: {
            characterId: participant.characterId,
            questId,
          },
        },
        data: { rewardClaimed: true },
      });

      // Publish experience gained event
      const experienceEvent: ExperienceGainedEvent = {
        type: EventType.EXPERIENCE_GAINED,
        actorId: userId,
        targetId: participant.characterId,
        payload: {
          experienceGained: quest.experienceReward,
          totalExperience: oldExperience + quest.experienceReward,
        },
        sessionId: quest.campaignId,
      };
      await this.eventBus.publish(experienceEvent);
    }

    // Publish quest finished event if there were rewards awarded
    if (completedParticipants.length > 0) {
      const questFinishedEvent: QuestFinishedEvent = {
        type: EventType.QUEST_FINISHED,
        actorId: userId,
        payload: {
          questId,
          experienceReward: quest.experienceReward,
          loot: [], // Could be enhanced to include actual loot
        },
        sessionId: quest.campaignId,
      };
      await this.eventBus.publish(questFinishedEvent);
    }
  }
}
