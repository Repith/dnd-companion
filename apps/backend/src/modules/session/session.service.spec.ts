import { Test, TestingModule } from "@nestjs/testing";
import { SessionService } from "./session.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CampaignService } from "../campaign/campaign.service";
import { EventBusService } from "../events/event-bus.service";
import { EventType } from "../events/dto";
import { CreateSessionDto, CreateEventDto } from "./dto";
import { NotFoundException, ForbiddenException } from "@nestjs/common";

describe("SessionService", () => {
  let service: SessionService;
  let prismaService: PrismaService;
  let eventBusService: EventBusService;

  const mockPrismaService = {
    session: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    campaign: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    character: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    gameEvent: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    inventory: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    inventoryItem: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    item: {
      findUnique: jest.fn(),
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
        SessionService,
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

    service = module.get<SessionService>(SessionService);
    prismaService = module.get<PrismaService>(PrismaService);
    eventBusService = module.get<EventBusService>(EventBusService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("logEvent", () => {
    it("should publish event to EventBus and return logged event", async () => {
      const sessionId = "session-1";
      const eventDto: CreateEventDto = {
        type: EventType.DICE_ROLL,
        actorId: "user-1",
        targetId: "character-1",
        payload: { result: 15, notation: "1d20" },
      };

      const mockSession = { id: sessionId, campaignId: "campaign-1" };
      const mockLoggedEvent = {
        id: "event-1",
        type: EventType.DICE_ROLL,
        actorId: "user-1",
        targetId: "character-1",
        sessionId,
        payload: eventDto.payload,
      };

      mockCampaignService.isUserInCampaign.mockResolvedValue(true);
      mockPrismaService.session.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.gameEvent.findFirst.mockResolvedValue(mockLoggedEvent);

      const result = await service.logEvent(sessionId, eventDto, "user-1");

      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        type: eventDto.type,
        actorId: eventDto.actorId,
        targetId: eventDto.targetId,
        sessionId,
        payload: eventDto.payload,
      });
      expect(result.id).toBe("event-1");
    });

    it("should throw ForbiddenException if user is not in campaign", async () => {
      const eventDto: CreateEventDto = {
        type: EventType.DICE_ROLL,
        payload: { result: 15 },
      };

      mockCampaignService.isUserInCampaign.mockResolvedValue(false);

      await expect(
        service.logEvent("session-1", eventDto, "user-1"),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("adjustHP", () => {
    it("should publish HEALING_RECEIVED event for positive HP adjustment", async () => {
      const sessionId = "session-1";
      const characterId = "character-1";
      const hpAdjustment = 10;

      const mockSession = { id: sessionId, campaignId: "campaign-1" };
      const mockCharacter = {
        id: characterId,
        hitPoints: { current: 20, max: 30, temporary: 0 },
      };
      const mockLoggedEvent = {
        id: "event-1",
        type: EventType.HEALING_RECEIVED,
        actorId: "user-1",
        targetId: characterId,
        sessionId,
      };

      mockCampaignService.isUserInCampaign.mockResolvedValue(true);
      mockPrismaService.session.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.character.findUnique.mockResolvedValue(mockCharacter);
      mockPrismaService.gameEvent.findFirst.mockResolvedValue(mockLoggedEvent);

      await service.adjustHP(sessionId, characterId, hpAdjustment, "user-1");

      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        type: EventType.HEALING_RECEIVED,
        actorId: "user-1",
        targetId: characterId,
        sessionId,
        payload: {
          healing: hpAdjustment,
          source: "session_adjustment",
        },
      });
    });

    it("should publish DAMAGE_APPLIED event for negative HP adjustment", async () => {
      const sessionId = "session-1";
      const characterId = "character-1";
      const hpAdjustment = -5;

      const mockSession = { id: sessionId, campaignId: "campaign-1" };
      const mockCharacter = {
        id: characterId,
        hitPoints: { current: 20, max: 30, temporary: 0 },
      };
      const mockLoggedEvent = {
        id: "event-1",
        type: EventType.DAMAGE_APPLIED,
        actorId: "user-1",
        targetId: characterId,
        sessionId,
      };

      mockCampaignService.isUserInCampaign.mockResolvedValue(true);
      mockPrismaService.session.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.character.findUnique.mockResolvedValue(mockCharacter);
      mockPrismaService.gameEvent.findFirst.mockResolvedValue(mockLoggedEvent);

      await service.adjustHP(sessionId, characterId, hpAdjustment, "user-1");

      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        type: EventType.DAMAGE_APPLIED,
        actorId: "user-1",
        targetId: characterId,
        sessionId,
        payload: {
          damage: Math.abs(hpAdjustment),
          damageType: "session_adjustment",
          source: "session_adjustment",
        },
      });
    });

    it("should use campaignId as sessionId in event context", async () => {
      const sessionId = "session-1";
      const characterId = "character-1";
      const hpAdjustment = 5;

      const mockSession = { id: sessionId, campaignId: "campaign-1" };
      const mockCharacter = {
        id: characterId,
        hitPoints: { current: 20, max: 30, temporary: 0 },
      };

      mockCampaignService.isUserInCampaign.mockResolvedValue(true);
      mockPrismaService.session.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.character.findUnique.mockResolvedValue(mockCharacter);
      mockPrismaService.gameEvent.findFirst.mockResolvedValue({
        id: "event-1",
      });

      await service.adjustHP(sessionId, characterId, hpAdjustment, "user-1");

      const publishedEvent = mockEventBusService.publish.mock.calls[0][0];
      expect(publishedEvent.sessionId).toBe(sessionId);
    });
  });

  describe("grantItem", () => {
    it("should publish ITEM_GIVEN event when granting item", async () => {
      const sessionId = "session-1";
      const characterId = "character-1";
      const itemId = "item-1";
      const quantity = 2;

      const mockSession = { id: sessionId, campaignId: "campaign-1" };
      const mockCharacter = { id: characterId, ownerId: "user-1" };
      const mockItem = { id: itemId, name: "Sword" };
      const mockInventory = {
        id: "inventory-1",
        ownerType: "CHARACTER",
        ownerId: characterId,
      };
      const mockLoggedEvent = {
        id: "event-1",
        type: EventType.ITEM_GIVEN,
        actorId: "user-1",
        targetId: characterId,
        sessionId,
      };

      mockCampaignService.isUserInCampaign.mockResolvedValue(true);
      mockPrismaService.session.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.character.findUnique.mockResolvedValue(mockCharacter);
      mockPrismaService.item.findUnique.mockResolvedValue(mockItem);
      mockPrismaService.inventory.findFirst.mockResolvedValue(mockInventory);
      mockPrismaService.inventoryItem.findFirst.mockResolvedValue(null);
      mockPrismaService.gameEvent.findFirst.mockResolvedValue(mockLoggedEvent);

      await service.grantItem(
        sessionId,
        characterId,
        itemId,
        quantity,
        "user-1",
      );

      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        type: EventType.ITEM_GIVEN,
        actorId: "user-1",
        targetId: characterId,
        sessionId,
        payload: {
          itemId,
          quantity,
        },
      });
    });

    it("should create inventory if character doesn't have one", async () => {
      const sessionId = "session-1";
      const characterId = "character-1";
      const itemId = "item-1";

      const mockSession = { id: sessionId, campaignId: "campaign-1" };
      const mockCharacter = { id: characterId, ownerId: "user-1" };
      const mockItem = { id: itemId, name: "Sword" };
      const mockInventory = {
        id: "inventory-1",
        ownerType: "CHARACTER",
        ownerId: characterId,
      };

      mockCampaignService.isUserInCampaign.mockResolvedValue(true);
      mockPrismaService.session.findUnique.mockResolvedValue(mockSession);
      mockPrismaService.character.findUnique.mockResolvedValue(mockCharacter);
      mockPrismaService.item.findUnique.mockResolvedValue(mockItem);
      mockPrismaService.inventory.findFirst.mockResolvedValue(null);
      mockPrismaService.inventory.create.mockResolvedValue(mockInventory);
      mockPrismaService.inventoryItem.findFirst.mockResolvedValue(null);
      mockPrismaService.gameEvent.findFirst.mockResolvedValue({
        id: "event-1",
      });

      await service.grantItem(sessionId, characterId, itemId, 1, "user-1");

      expect(mockPrismaService.inventory.create).toHaveBeenCalledWith({
        data: {
          ownerType: "CHARACTER",
          ownerId: characterId,
        },
      });
    });
  });
});
