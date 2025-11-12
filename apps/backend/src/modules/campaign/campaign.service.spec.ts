import { Test, TestingModule } from "@nestjs/testing";
import { CampaignService } from "./campaign.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateCampaignDto, UpdateCampaignDto } from "./dto";

describe("CampaignService", () => {
  let service: CampaignService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    campaign: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CampaignService>(CampaignService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a campaign", async () => {
      const createDto: CreateCampaignDto = {
        name: "Test Campaign",
        description: "A test campaign",
      };
      const dmId = "dm-uuid";
      const mockCampaign = {
        id: "campaign-uuid",
        ...createDto,
        dmId,
        playerIds: [],
        questIds: [],
        npcIds: [],
        locationIds: [],
        currentSessionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.campaign.create.mockResolvedValue(mockCampaign);

      const result = await service.create(createDto, dmId);

      expect(mockPrismaService.campaign.create).toHaveBeenCalledWith({
        data: { ...createDto, dmId },
      });
      expect(result).toEqual(mockCampaign);
    });
  });

  describe("findById", () => {
    it("should return a campaign if found", async () => {
      const campaignId = "campaign-uuid";
      const mockCampaign = {
        id: campaignId,
        name: "Test Campaign",
        description: "A test campaign",
        dmId: "dm-uuid",
        players: [],
        quests: [],
        sessions: [],
        npcs: [],
        locations: [],
        currentSessionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.campaign.findUnique.mockResolvedValue(mockCampaign);

      const result = await service.findById(campaignId);

      expect(mockPrismaService.campaign.findUnique).toHaveBeenCalledWith({
        where: { id: campaignId },
        include: {
          quests: true,
          sessions: true,
          npcs: true,
          locations: true,
          players: true,
        },
      });
      expect(result).toBeDefined();
    });

    it("should return null if campaign not found", async () => {
      const campaignId = "non-existent-uuid";

      mockPrismaService.campaign.findUnique.mockResolvedValue(null);

      const result = await service.findById(campaignId);

      expect(result).toBeNull();
    });
  });

  describe("isUserInCampaign", () => {
    it("should return true if user is DM", async () => {
      const campaignId = "campaign-uuid";
      const userId = "dm-uuid";
      const mockCampaign = {
        id: campaignId,
        dmId: userId,
        players: [],
      };

      mockPrismaService.campaign.findUnique.mockResolvedValue(mockCampaign);

      const result = await service.isUserInCampaign(campaignId, userId);

      expect(result).toBe(true);
    });

    it("should return true if user is a player", async () => {
      const campaignId = "campaign-uuid";
      const userId = "player-uuid";
      const mockCampaign = {
        id: campaignId,
        dmId: "dm-uuid",
        players: [{ id: userId }],
      };

      mockPrismaService.campaign.findUnique.mockResolvedValue(mockCampaign);

      const result = await service.isUserInCampaign(campaignId, userId);

      expect(result).toBe(true);
    });

    it("should return false if user is not in campaign", async () => {
      const campaignId = "campaign-uuid";
      const userId = "user-uuid";
      const mockCampaign = {
        id: campaignId,
        dmId: "dm-uuid",
        players: [{ id: "player-uuid" }],
      };

      mockPrismaService.campaign.findUnique.mockResolvedValue(mockCampaign);

      const result = await service.isUserInCampaign(campaignId, userId);

      expect(result).toBe(false);
    });
  });
});
