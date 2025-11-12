import { Test, TestingModule } from "@nestjs/testing";
import { LocationService } from "./location.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CampaignService } from "../campaign/campaign.service";
import { CreateLocationDto } from "./dto";

describe("LocationService", () => {
  let service: LocationService;
  let prismaService: PrismaService;
  let campaignService: CampaignService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: PrismaService,
          useValue: {
            location: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            campaign: {
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: CampaignService,
          useValue: {
            isUserDM: jest.fn(),
            isUserInCampaign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
    prismaService = module.get<PrismaService>(PrismaService);
    campaignService = module.get<CampaignService>(CampaignService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a location when user is DM", async () => {
      const createDto: CreateLocationDto = {
        name: "Test Location",
        type: "CITY" as any,
        description: "A test location",
      };
      const campaignId = "campaign-1";
      const userId = "user-1";

      jest.spyOn(campaignService, "isUserDM").mockResolvedValue(true);
      jest.spyOn(prismaService.location, "create").mockResolvedValue({
        id: "location-1",
        ...createDto,
        mapUrl: null,
        parentId: null,
        campaigns: [{ id: campaignId }],
        npcs: [],
        quests: [],
        parent: null,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.create(createDto, campaignId, userId);

      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
      expect(campaignService.isUserDM).toHaveBeenCalledWith(campaignId, userId);
    });

    it("should throw ForbiddenException when user is not DM", async () => {
      const createDto: CreateLocationDto = {
        name: "Test Location",
        type: "CITY" as any,
      };
      const campaignId = "campaign-1";
      const userId = "user-1";

      jest.spyOn(campaignService, "isUserDM").mockResolvedValue(false);

      await expect(
        service.create(createDto, campaignId, userId),
      ).rejects.toThrow("Only the DM can create locations");
    });

    it("should create a location with minimal data", async () => {
      const createDto: CreateLocationDto = {
        name: "Test Location",
        type: "CITY" as any,
      };
      const campaignId = "campaign-1";
      const userId = "user-1";

      jest.spyOn(campaignService, "isUserDM").mockResolvedValue(true);
      jest.spyOn(prismaService.location, "create").mockResolvedValue({
        id: "location-1",
        ...createDto,
        description: null,
        mapUrl: null,
        parentId: null,
        campaigns: [{ id: campaignId }],
        npcs: [],
        quests: [],
        parent: null,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.create(createDto, campaignId, userId);

      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
      expect(campaignService.isUserDM).toHaveBeenCalledWith(campaignId, userId);
    });
  });

  describe("getHierarchy", () => {
    it("should return hierarchical locations", async () => {
      const campaignId = "campaign-1";
      const userId = "user-1";

      const mockLocations = [
        {
          id: "loc-1",
          name: "Parent Location",
          type: "CITY" as any,
          description: null,
          mapUrl: null,
          parentId: null,
          campaigns: [{ id: campaignId }],
          npcs: [],
          quests: [],
          parent: null,
          children: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "loc-2",
          name: "Child Location",
          type: "DUNGEON" as any,
          description: null,
          mapUrl: null,
          parentId: "loc-1",
          campaigns: [{ id: campaignId }],
          npcs: [],
          quests: [],
          parent: null,
          children: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(campaignService, "isUserInCampaign").mockResolvedValue(true);
      jest
        .spyOn(prismaService.location, "findMany")
        .mockResolvedValue(mockLocations as any);

      const result = await service.getHierarchy(campaignId, userId);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].name).toBe("Parent Location");
    });
  });
});
