import { Test, TestingModule } from "@nestjs/testing";
import { CharacterService } from "./character.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { EventBusService } from "../events/event-bus.service";
import { InventoryService } from "../inventory/inventory.service";
import { CreateCharacterDto, UpdateCharacterDto } from "./dto";
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";

describe("CharacterService", () => {
  let service: CharacterService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    character: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    campaign: {
      findUnique: jest.fn(),
    },
    spell: {
      findUnique: jest.fn(),
    },
    item: {
      findFirst: jest.fn(),
    },
  };

  const mockEventBusService = {
    publish: jest.fn(),
  };

  const mockInventoryService = {
    createCharacterInventory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharacterService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventBusService,
          useValue: mockEventBusService,
        },
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
      ],
    }).compile();

    service = module.get<CharacterService>(CharacterService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("calculateProficiencyBonus", () => {
    it("should calculate proficiency bonus correctly", () => {
      expect((service as any).calculateProficiencyBonus(1)).toBe(2);
      expect((service as any).calculateProficiencyBonus(5)).toBe(3);
      expect((service as any).calculateProficiencyBonus(9)).toBe(4);
      expect((service as any).calculateProficiencyBonus(13)).toBe(5);
      expect((service as any).calculateProficiencyBonus(17)).toBe(6);
    });
  });

  describe("calculateAbilityModifier", () => {
    it("should calculate ability modifier correctly", () => {
      expect((service as any).calculateAbilityModifier(10)).toBe(0);
      expect((service as any).calculateAbilityModifier(12)).toBe(1);
      expect((service as any).calculateAbilityModifier(14)).toBe(2);
      expect((service as any).calculateAbilityModifier(16)).toBe(3);
      expect((service as any).calculateAbilityModifier(8)).toBe(-1);
    });
  });

  describe("validateDnDRules", () => {
    it("should throw error for invalid ability scores", () => {
      const invalidDto = {
        abilityScores: {
          strength: 2,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
      };

      expect(() => (service as any).validateDnDRules(invalidDto)).toThrow(
        BadRequestException,
      );
    });

    it("should throw error for invalid level", () => {
      const invalidDto = { level: 21 };

      expect(() => (service as any).validateDnDRules(invalidDto)).toThrow(
        BadRequestException,
      );
    });

    it("should throw error for negative experience points", () => {
      const invalidDto = { experiencePoints: -1 };

      expect(() => (service as any).validateDnDRules(invalidDto)).toThrow(
        BadRequestException,
      );
    });

    it("should throw error for invalid hit points", () => {
      const invalidDto = { hitPoints: { max: 10, current: 15, temporary: 0 } };

      expect(() => (service as any).validateDnDRules(invalidDto)).toThrow(
        BadRequestException,
      );
    });

    it("should throw error for invalid armor class", () => {
      const invalidDto = { armorClass: 3 };

      expect(() => (service as any).validateDnDRules(invalidDto)).toThrow(
        BadRequestException,
      );
    });

    it("should throw error for invalid spellcasting DC", () => {
      const invalidDto = {
        spellcasting: {
          class: "Wizard",
          saveDC: 7,
          attackBonus: 3,
          knownSpells: [],
          preparedSpells: [],
          slots: {},
        },
      };

      expect(() => (service as any).validateDnDRules(invalidDto)).toThrow(
        BadRequestException,
      );
    });

    it("should not throw for valid data", () => {
      const validDto = {
        abilityScores: {
          strength: 15,
          dexterity: 14,
          constitution: 13,
          intelligence: 12,
          wisdom: 10,
          charisma: 8,
        },
        level: 5,
        experiencePoints: 1000,
        hitPoints: { max: 30, current: 25, temporary: 5 },
        armorClass: 16,
        spellcasting: {
          class: "Wizard",
          saveDC: 14,
          attackBonus: 6,
          knownSpells: [],
          preparedSpells: [],
          slots: {},
        },
      };

      expect(() => (service as any).validateDnDRules(validDto)).not.toThrow();
    });
  });

  describe("create", () => {
    const createDto: CreateCharacterDto = {
      name: "Test Character",
      race: "HUMAN" as any,
      multiclasses: [{ class: "FIGHTER" as any, level: 1 }],
      level: 1,
      experiencePoints: 0,
      inspiration: false,
      abilityScores: {
        strength: 15,
        dexterity: 14,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 8,
      },
      skillProficiencies: [
        { skill: "ACROBATICS" as any, proficient: false, expertise: false },
        {
          skill: "ANIMAL_HANDLING" as any,
          proficient: false,
          expertise: false,
        },
        { skill: "ARCANA" as any, proficient: false, expertise: false },
        { skill: "ATHLETICS" as any, proficient: true, expertise: false },
        { skill: "DECEPTION" as any, proficient: false, expertise: false },
        { skill: "HISTORY" as any, proficient: false, expertise: false },
        { skill: "INSIGHT" as any, proficient: false, expertise: false },
        { skill: "INTIMIDATION" as any, proficient: false, expertise: false },
        { skill: "INVESTIGATION" as any, proficient: false, expertise: false },
        { skill: "MEDICINE" as any, proficient: false, expertise: false },
        { skill: "NATURE" as any, proficient: false, expertise: false },
        { skill: "PERCEPTION" as any, proficient: false, expertise: false },
        { skill: "PERFORMANCE" as any, proficient: false, expertise: false },
        { skill: "PERSUASION" as any, proficient: false, expertise: false },
        { skill: "RELIGION" as any, proficient: false, expertise: false },
        {
          skill: "SLEIGHT_OF_HAND" as any,
          proficient: false,
          expertise: false,
        },
        { skill: "STEALTH" as any, proficient: false, expertise: false },
        { skill: "SURVIVAL" as any, proficient: false, expertise: false },
      ],
      savingThrows: {},
      hitPoints: { max: 12, current: 12, temporary: 0 },
      armorClass: 16,
      initiative: 2,
      speed: 30,
      featuresTraits: ["Fighting Style"],
      languages: ["Common"],
      currency: { cp: 0, sp: 0, ep: 0, gp: 10, pp: 0 },
    };

    it("should create a character successfully", async () => {
      const mockCharacter = { id: "1", ...createDto };
      mockPrismaService.character.create.mockResolvedValue(
        mockCharacter as any,
      );

      const result = await service.create(createDto, "user-id");

      expect(mockPrismaService.character.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should throw error if user does not exist", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const dtoWithOwner = { ...createDto, ownerId: "invalid-user" };

      await expect(service.create(dtoWithOwner, "user-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw error if campaign does not exist", async () => {
      mockPrismaService.campaign.findUnique.mockResolvedValue(null);

      const dtoWithCampaign = { ...createDto, campaignId: "invalid-campaign" };

      await expect(service.create(dtoWithCampaign, "user-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findAll", () => {
    it("should return characters for user", async () => {
      const mockCharacters = [{ id: "1", name: "Character 1" }];
      mockPrismaService.character.findMany.mockResolvedValue(
        mockCharacters as any,
      );

      const result = await service.findAll("user-id");

      expect(mockPrismaService.character.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ ownerId: "user-id" }, { campaignId: { not: null } }],
        },
        include: {
          abilityScores: true,
          skillProficiencies: true,
          multiclasses: true,
        },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("findOne", () => {
    it("should return a character", async () => {
      const mockCharacter = {
        id: "1",
        name: "Test Character",
        ownerId: "user-id",
      };
      mockPrismaService.character.findUnique.mockResolvedValue(
        mockCharacter as any,
      );

      const result = await service.findOne("1", "user-id");

      expect(result).toBeDefined();
      expect(result.id).toBe("1");
    });

    it("should throw NotFoundException if character does not exist", async () => {
      mockPrismaService.character.findUnique.mockResolvedValue(null);

      await expect(service.findOne("1", "user-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ForbiddenException if user doesn't own character", async () => {
      const mockCharacter = {
        id: "1",
        name: "Test Character",
        ownerId: "other-user",
      };
      mockPrismaService.character.findUnique.mockResolvedValue(
        mockCharacter as any,
      );

      await expect(service.findOne("1", "user-id")).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("update", () => {
    const updateDto: UpdateCharacterDto = {
      name: "Updated Name",
      level: 2,
    };

    it("should update a character", async () => {
      const mockCharacter = {
        id: "1",
        name: "Test Character",
        ownerId: "user-id",
      };
      const updatedCharacter = { ...mockCharacter, name: "Updated Name" };

      mockPrismaService.character.findUnique.mockResolvedValue(
        mockCharacter as any,
      );
      mockPrismaService.character.update.mockResolvedValue(
        updatedCharacter as any,
      );

      const result = await service.update("1", updateDto, "user-id");

      expect(mockPrismaService.character.update).toHaveBeenCalled();
      expect(result.name).toBe("Updated Name");
    });

    it("should publish DAMAGE_APPLIED event when HP decreases", async () => {
      const hpUpdateDto: UpdateCharacterDto = {
        hitPoints: { current: 5, max: 20, temporary: 0 },
      };

      const mockCharacter = {
        id: "1",
        name: "Test Character",
        ownerId: "user-id",
        hitPoints: { current: 15, max: 20, temporary: 0 },
        campaignId: "campaign-1",
      };

      mockPrismaService.character.findUnique.mockResolvedValue(
        mockCharacter as any,
      );
      mockPrismaService.character.update.mockResolvedValue({
        ...mockCharacter,
        hitPoints: hpUpdateDto.hitPoints,
      } as any);

      await service.update("1", hpUpdateDto, "user-id");

      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        type: "DAMAGE_APPLIED",
        targetId: "1",
        payload: {
          damage: 10,
          damageType: "unknown",
        },
        sessionId: "campaign-1",
        actorId: "user-id",
      });
    });

    it("should publish HEALING_RECEIVED event when HP increases", async () => {
      const hpUpdateDto: UpdateCharacterDto = {
        hitPoints: { current: 18, max: 20, temporary: 0 },
      };

      const mockCharacter = {
        id: "1",
        name: "Test Character",
        ownerId: "user-id",
        hitPoints: { current: 15, max: 20, temporary: 0 },
        campaignId: "campaign-1",
      };

      mockPrismaService.character.findUnique.mockResolvedValue(
        mockCharacter as any,
      );
      mockPrismaService.character.update.mockResolvedValue({
        ...mockCharacter,
        hitPoints: hpUpdateDto.hitPoints,
      } as any);

      await service.update("1", hpUpdateDto, "user-id");

      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        type: "HEALING_RECEIVED",
        targetId: "1",
        payload: {
          healing: 3,
        },
        sessionId: "campaign-1",
        actorId: "user-id",
      });
    });

    it("should publish DEATH event when HP reaches zero", async () => {
      const hpUpdateDto: UpdateCharacterDto = {
        hitPoints: { current: 0, max: 20, temporary: 0 },
      };

      const mockCharacter = {
        id: "1",
        name: "Test Character",
        ownerId: "user-id",
        hitPoints: { current: 10, max: 20, temporary: 0 },
        campaignId: "campaign-1",
      };

      mockPrismaService.character.findUnique.mockResolvedValue(
        mockCharacter as any,
      );
      mockPrismaService.character.update.mockResolvedValue({
        ...mockCharacter,
        hitPoints: hpUpdateDto.hitPoints,
      } as any);

      await service.update("1", hpUpdateDto, "user-id");

      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        type: "DAMAGE_APPLIED",
        targetId: "1",
        payload: {
          damage: 10,
          damageType: "unknown",
        },
        sessionId: "campaign-1",
        actorId: "user-id",
      });

      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        type: "DEATH",
        targetId: "1",
        payload: {
          cause: "damage",
        },
        sessionId: "campaign-1",
        actorId: "user-id",
      });
    });

    it("should publish LEVEL_UP event when level increases", async () => {
      const levelUpdateDto: UpdateCharacterDto = {
        level: 3,
      };

      const mockCharacter = {
        id: "1",
        name: "Test Character",
        ownerId: "user-id",
        level: 2,
        campaignId: "campaign-1",
      };

      mockPrismaService.character.findUnique.mockResolvedValue(
        mockCharacter as any,
      );
      mockPrismaService.character.update.mockResolvedValue({
        ...mockCharacter,
        level: 3,
      } as any);

      await service.update("1", levelUpdateDto, "user-id");

      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        type: "LEVEL_UP",
        targetId: "1",
        payload: {
          newLevel: 3,
          oldLevel: 2,
        },
        sessionId: "campaign-1",
        actorId: "user-id",
      });
    });

    it("should publish EXPERIENCE_GAINED event when experience increases", async () => {
      const expUpdateDto: UpdateCharacterDto = {
        experiencePoints: 1500,
      };

      const mockCharacter = {
        id: "1",
        name: "Test Character",
        ownerId: "user-id",
        experiencePoints: 1000,
        campaignId: "campaign-1",
      };

      mockPrismaService.character.findUnique.mockResolvedValue(
        mockCharacter as any,
      );
      mockPrismaService.character.update.mockResolvedValue({
        ...mockCharacter,
        experiencePoints: 1500,
      } as any);

      await service.update("1", expUpdateDto, "user-id");

      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        type: "EXPERIENCE_GAINED",
        targetId: "1",
        payload: {
          experienceGained: 500,
          totalExperience: 1500,
        },
        sessionId: "campaign-1",
        actorId: "user-id",
      });
    });

    it("should throw NotFoundException if character does not exist", async () => {
      mockPrismaService.character.findUnique.mockResolvedValue(null);

      await expect(service.update("1", updateDto, "user-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ForbiddenException if user doesn't own character", async () => {
      const mockCharacter = {
        id: "1",
        name: "Test Character",
        ownerId: "other-user",
      };
      mockPrismaService.character.findUnique.mockResolvedValue(
        mockCharacter as any,
      );

      await expect(service.update("1", updateDto, "user-id")).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("remove", () => {
    it("should delete a character", async () => {
      const mockCharacter = {
        id: "1",
        name: "Test Character",
        ownerId: "user-id",
      };
      mockPrismaService.character.findUnique.mockResolvedValue(
        mockCharacter as any,
      );
      mockPrismaService.character.delete.mockResolvedValue(
        mockCharacter as any,
      );

      await service.remove("1", "user-id");

      expect(mockPrismaService.character.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });

    it("should throw NotFoundException if character does not exist", async () => {
      mockPrismaService.character.findUnique.mockResolvedValue(null);

      await expect(service.remove("1", "user-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ForbiddenException if user doesn't own character", async () => {
      const mockCharacter = {
        id: "1",
        name: "Test Character",
        ownerId: "other-user",
      };
      mockPrismaService.character.findUnique.mockResolvedValue(
        mockCharacter as any,
      );

      await expect(service.remove("1", "user-id")).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
