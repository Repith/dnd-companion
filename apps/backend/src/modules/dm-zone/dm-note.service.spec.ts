import { Test, TestingModule } from "@nestjs/testing";
import { DMNoteService } from "./dm-note.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CampaignService } from "../campaign/campaign.service";
import { CreateDMNoteDto, CreateLinkDto } from "./dto";

describe("DMNoteService", () => {
  let service: DMNoteService;
  let prismaService: PrismaService;
  let campaignService: CampaignService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DMNoteService,
        {
          provide: PrismaService,
          useValue: {
            dMNote: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            link: {
              create: jest.fn(),
              findMany: jest.fn(),
              delete: jest.fn(),
            },
            location: {
              findUnique: jest.fn(),
            },
            character: {
              findUnique: jest.fn(),
            },
            quest: {
              findUnique: jest.fn(),
            },
            item: {
              findUnique: jest.fn(),
            },
            spell: {
              findUnique: jest.fn(),
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

    service = module.get<DMNoteService>(DMNoteService);
    prismaService = module.get<PrismaService>(PrismaService);
    campaignService = module.get<CampaignService>(CampaignService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a DM note", async () => {
      const createDto: CreateDMNoteDto = {
        content: "Test note content",
      };
      const userId = "user-1";

      jest.spyOn(campaignService, "isUserDM").mockResolvedValue(true);
      jest.spyOn(prismaService.dMNote, "create").mockResolvedValue({
        id: "note-1",
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(createDto, "", userId);

      expect(result).toBeDefined();
      expect(result.content).toBe(createDto.content);
    });
  });

  describe("createLink", () => {
    it("should create a link to a location", async () => {
      const noteId = "note-1";
      const linkDto: CreateLinkDto = {
        relatedEntityType: "LOCATION",
        relatedEntityId: "location-1",
        relationship: "located in",
      };
      const userId = "user-1";

      jest.spyOn(prismaService.dMNote, "findUnique").mockResolvedValue({
        id: noteId,
        content: "Test note",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(prismaService.location, "findUnique").mockResolvedValue({
        id: "location-1",
        name: "Test Location",
        type: "CITY" as any,
        description: null,
        mapUrl: null,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      jest.spyOn(prismaService.link, "create").mockResolvedValue({
        id: "link-1",
        noteId,
        ...linkDto,
      });

      const result = await service.createLink(noteId, linkDto, userId);

      expect(result).toBeDefined();
      expect(result.relatedEntityType).toBe(linkDto.relatedEntityType);
      expect(result.relationship).toBe(linkDto.relationship);
    });

    it("should throw error for invalid entity type", async () => {
      const noteId = "note-1";
      const linkDto: CreateLinkDto = {
        relatedEntityType: "INVALID",
        relatedEntityId: "entity-1",
        relationship: "related to",
      };
      const userId = "user-1";

      jest.spyOn(prismaService.dMNote, "findUnique").mockResolvedValue({
        id: noteId,
        content: "Test note",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.createLink(noteId, linkDto, userId)).rejects.toThrow(
        "Unknown entity type: INVALID",
      );
    });
  });
});
