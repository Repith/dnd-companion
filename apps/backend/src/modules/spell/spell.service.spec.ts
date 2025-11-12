import { Test, TestingModule } from "@nestjs/testing";
import { SpellService } from "./spell.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateSpellDto, UpdateSpellDto, SpellSchool } from "./dto";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("SpellService", () => {
  let service: SpellService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    spell: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    character: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpellService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SpellService>(SpellService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new spell successfully", async () => {
      const createDto: CreateSpellDto = {
        name: "Magic Missile",
        level: 1,
        school: SpellSchool.EVOCATION,
        castingTime: "1 action",
        range: "120 feet",
        components: {
          verbal: true,
          somatic: true,
        },
        duration: {
          duration: "Instantaneous",
        },
        classes: ["Wizard", "Sorcerer"],
        description: "You create three glowing darts of magical force.",
      };

      const createdSpell = {
        id: "1",
        ...createDto,
        higherLevel: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.spell.create.mockResolvedValue(createdSpell);
      mockPrismaService.spell.findFirst.mockResolvedValue(null);

      const result = await service.create(createDto);

      expect(mockPrismaService.spell.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          level: createDto.level,
          school: createDto.school,
          castingTime: createDto.castingTime,
          range: createDto.range,
          components: createDto.components,
          duration: createDto.duration,
          classes: createDto.classes,
          description: createDto.description,
          higherLevel: createDto.higherLevel,
        },
      });
      expect(result.name).toBe(createDto.name);
    });

    it("should throw BadRequestException for duplicate spell name", async () => {
      const createDto: CreateSpellDto = {
        name: "Magic Missile",
        level: 1,
        duration: { duration: "Instantaneous" },
        classes: ["Wizard"],
      };

      mockPrismaService.spell.findFirst.mockResolvedValue({ id: "existing" });

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        "Spell with this name already exists",
      );
    });

    it("should throw BadRequestException for invalid spell level", async () => {
      const createDto: CreateSpellDto = {
        name: "Invalid Spell",
        level: 10, // Invalid level
        duration: { duration: "Instantaneous" },
        classes: ["Wizard"],
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        "Spell level must be between 0 and 9",
      );
    });

    it("should throw BadRequestException for spell without classes", async () => {
      const createDto: CreateSpellDto = {
        name: "Invalid Spell",
        level: 1,
        duration: { duration: "Instantaneous" },
        classes: [], // Empty classes
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        "Spell must have at least one class",
      );
    });
  });

  describe("findAll", () => {
    it("should return filtered spells by level", async () => {
      const filters = { level: 1 };
      const spells = [
        {
          id: "1",
          name: "Magic Missile",
          level: 1,
          school: SpellSchool.EVOCATION,
          castingTime: "1 action",
          range: "120 feet",
          components: { verbal: true, somatic: true },
          duration: { duration: "Instantaneous" },
          classes: ["Wizard"],
          description: "Test spell",
          higherLevel: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.spell.findMany.mockResolvedValue(spells);

      const result = await service.findAll(filters);

      expect(mockPrismaService.spell.findMany).toHaveBeenCalledWith({
        where: { level: 1 },
        orderBy: [{ level: "asc" }, { name: "asc" }],
      });
      expect(result).toHaveLength(1);
    });

    it("should return spells filtered by class", async () => {
      const filters = { class: "Wizard" };
      const spells = [
        {
          id: "1",
          name: "Magic Missile",
          level: 1,
          classes: ["Wizard", "Sorcerer"],
          duration: { duration: "Instantaneous" },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.spell.findMany.mockResolvedValue(spells);

      const result = await service.findAll(filters);

      expect(mockPrismaService.spell.findMany).toHaveBeenCalledWith({
        where: { classes: { has: "Wizard" } },
        orderBy: [{ level: "asc" }, { name: "asc" }],
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("findOne", () => {
    it("should return a spell by id", async () => {
      const spell = {
        id: "1",
        name: "Magic Missile",
        level: 1,
        classes: ["Wizard"],
        duration: { duration: "Instantaneous" },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.spell.findUnique.mockResolvedValue(spell);

      const result = await service.findOne("1");

      expect(result).toEqual(spell);
    });

    it("should throw NotFoundException if spell not found", async () => {
      mockPrismaService.spell.findUnique.mockResolvedValue(null);

      await expect(service.findOne("999")).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("should update a spell successfully", async () => {
      const updateDto: UpdateSpellDto = {
        description: "Updated description",
      };

      const existingSpell = {
        id: "1",
        name: "Magic Missile",
        level: 1,
        classes: ["Wizard"],
        duration: { duration: "Instantaneous" },
        description: "Original description",
      };

      const updatedSpell = {
        ...existingSpell,
        description: updateDto.description,
        updatedAt: new Date(),
      };

      mockPrismaService.spell.findUnique.mockResolvedValue(existingSpell);
      mockPrismaService.spell.findFirst.mockResolvedValue(null);
      mockPrismaService.spell.update.mockResolvedValue(updatedSpell);

      const result = await service.update("1", updateDto);

      expect(result.description).toBe(updateDto.description);
    });

    it("should throw NotFoundException if spell to update not found", async () => {
      mockPrismaService.spell.findUnique.mockResolvedValue(null);

      await expect(service.update("999", { name: "Test" })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("remove", () => {
    it("should delete a spell successfully", async () => {
      const spell = {
        id: "1",
        name: "Magic Missile",
        level: 1,
        classes: ["Wizard"],
        duration: { duration: "Instantaneous" },
      };

      mockPrismaService.spell.findUnique.mockResolvedValue(spell);
      mockPrismaService.character.count.mockResolvedValue(0);
      mockPrismaService.spell.delete.mockResolvedValue(spell);

      await service.remove("1");

      expect(mockPrismaService.spell.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });

    it("should throw BadRequestException if spell is in use", async () => {
      const spell = {
        id: "1",
        name: "Magic Missile",
        level: 1,
        classes: ["Wizard"],
        duration: { duration: "Instantaneous" },
      };

      mockPrismaService.spell.findUnique.mockResolvedValue(spell);
      mockPrismaService.character.count.mockResolvedValue(1);

      await expect(service.remove("1")).rejects.toThrow(BadRequestException);
      await expect(service.remove("1")).rejects.toThrow(
        "Cannot delete spell that is currently known or prepared by characters",
      );
    });
  });
});
