import { Test, TestingModule } from "@nestjs/testing";
import { QuestService } from "./quest.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CampaignService } from "../campaign/campaign.service";
import { EventBusService } from "../events/event-bus.service";
import { EventType } from "../events/dto";
import { CreateQuestDto, UpdateQuestDto } from "./dto";
import { QuestStatus } from "./dto/types";
import { NotFoundException, ForbiddenException } from "@nestjs/common";

describe("QuestService", () => {
  let service: QuestService;
  let prismaService: PrismaService;
  let eventBusService: EventBusService;

  const mockPrismaService = {
    quest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    character: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    characterQuest: {
      upsert: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockCampaignService = {
    isUserDM: jest.fn(),
    isUserInCampaign: jest.fn(),
  };

  const mockEventBusService = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CampaignService,
          useValue: mockCampaignService,
        },
        {
          provide: EventBusService,
          useValue: mockEventBusService,
        },
      ],
    }).compile();

    service = module.get<QuestService>(QuestService);
    prismaService = module.get<PrismaService>(PrismaService);
    eventBusService = module.get<EventBusService>(EventBusService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("update", () => {
    it("should publish QUEST_UPDATED event when quest status changes", async () => {
      const updateDto: UpdateQuestDto = {
        status: QuestStatus.IN_PROGRESS,
      };

      const mockQuest = {
        id: "quest-1",
        status: QuestStatus.NOT_STARTED,
        campaignId: "campaign-1",
        experienceReward: 100,
      };

      mockCampaignService.isUserDM.mockResolvedValue(true);
      mockPrismaService.quest.findUnique.mockResolvedValue(mockQuest);
      mockPrismaService.quest.update.mockResolvedValue({
        ...mockQuest,
        status: QuestStatus.IN_PROGRESS,
      });

      await service.update("quest-1", updateDto, "user-1");

      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        type: EventType.QUEST_UPDATED,
        actorId: "user-1",
        payload: {
          questId: "quest-1",
          oldStatus: QuestStatus.NOT_STARTED,
          newStatus: QuestStatus.IN_PROGRESS,
          experienceReward: 100,
        },
        sessionId: "campaign-1",
      });
    });

    it("should not publish event when status doesn't change", async () => {
      const updateDto: UpdateQuestDto = {
        name: "Updated Title",
      };

      const mockQuest = {
        id: "quest-1",
        status: QuestStatus.NOT_STARTED,
        campaignId: "campaign-1",
        name: "Original Title",
      };

      mockCampaignService.isUserDM.mockResolvedValue(true);
      mockPrismaService.quest.findUnique.mockResolvedValue(mockQuest);
      mockPrismaService.quest.update.mockResolvedValue({
        ...mockQuest,
        name: "Updated Title",
      });

      await service.update("quest-1", updateDto, "user-1");

      expect(mockEventBusService.publish).not.toHaveBeenCalled();
    });
  });

  describe("awardRewards", () => {
    it("should publish EXPERIENCE_GAINED and QUEST_FINISHED events when awarding rewards", async () => {
      const mockQuest = {
        id: "quest-1",
        campaignId: "campaign-1",
        experienceReward: 100,
        participants: [
          {
            characterId: "char-1",
            status: QuestStatus.COMPLETED,
            rewardClaimed: false,
            character: { experiencePoints: 500 },
          },
          {
            characterId: "char-2",
            status: QuestStatus.COMPLETED,
            rewardClaimed: false,
            character: { experiencePoints: 300 },
          },
        ],
      };

      mockCampaignService.isUserDM.mockResolvedValue(true);
      mockPrismaService.quest.findUnique.mockResolvedValue(mockQuest);
      mockPrismaService.character.findUnique
        .mockResolvedValueOnce({ experiencePoints: 500 })
        .mockResolvedValueOnce({ experiencePoints: 300 });
      mockPrismaService.character.update.mockResolvedValue({} as any);
      mockPrismaService.characterQuest.update.mockResolvedValue({} as any);

      await service.awardRewards("quest-1", "user-1");

      // Should publish EXPERIENCE_GAINED for each participant
      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        type: EventType.EXPERIENCE_GAINED,
        actorId: "user-1",
        targetId: "char-1",
        payload: {
          experienceGained: 100,
          totalExperience: 600,
        },
        sessionId: "campaign-1",
      });

      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        type: EventType.EXPERIENCE_GAINED,
        actorId: "user-1",
        targetId: "char-2",
        payload: {
          experienceGained: 100,
          totalExperience: 400,
        },
        sessionId: "campaign-1",
      });

      // Should publish QUEST_FINISHED event
      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        type: EventType.QUEST_FINISHED,
        actorId: "user-1",
        payload: {
          questId: "quest-1",
          experienceReward: 100,
          loot: [],
        },
        sessionId: "campaign-1",
      });
    });

    it("should not publish events when no participants have completed quests", async () => {
      const mockQuest = {
        id: "quest-1",
        campaignId: "campaign-1",
        experienceReward: 100,
        participants: [
          {
            characterId: "char-1",
            status: QuestStatus.IN_PROGRESS,
            rewardClaimed: false,
          },
        ],
      };

      mockCampaignService.isUserDM.mockResolvedValue(true);
      mockPrismaService.quest.findUnique.mockResolvedValue(mockQuest);

      await service.awardRewards("quest-1", "user-1");

      expect(mockEventBusService.publish).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenException if user is not DM", async () => {
      mockCampaignService.isUserDM.mockResolvedValue(false);

      await expect(service.awardRewards("quest-1", "user-1")).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("updateProgress", () => {
    it("should update character quest progress", async () => {
      const mockQuest = {
        id: "quest-1",
        campaignId: "campaign-1",
      };

      const mockCharacter = {
        id: "char-1",
        ownerId: "user-1",
      };

      mockCampaignService.isUserInCampaign.mockResolvedValue(true);
      mockPrismaService.quest.findUnique.mockResolvedValue(mockQuest);
      mockPrismaService.character.findUnique.mockResolvedValue(mockCharacter);
      mockPrismaService.characterQuest.upsert.mockResolvedValue({} as any);

      await service.updateProgress(
        "quest-1",
        "char-1",
        QuestStatus.COMPLETED,
        "user-1",
      );

      expect(mockPrismaService.characterQuest.upsert).toHaveBeenCalledWith({
        where: {
          characterId_questId: {
            characterId: "char-1",
            questId: "quest-1",
          },
        },
        update: { status: QuestStatus.COMPLETED },
        create: {
          characterId: "char-1",
          questId: "quest-1",
          status: QuestStatus.COMPLETED,
        },
      });
    });
  });
});
