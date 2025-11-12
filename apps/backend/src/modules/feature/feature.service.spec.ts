import { Test, TestingModule } from "@nestjs/testing";
import { FeatureService } from "./feature.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateFeatureDto, UpdateFeatureDto } from "./dto";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("FeatureService", () => {
  let service: FeatureService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    feature: {
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
        FeatureService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FeatureService>(FeatureService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new feature successfully", async () => {
      const createDto: CreateFeatureDto = {
        name: "Spellcasting",
        description: "You can cast spells.",
        source: "Player's Handbook",
        level: 1,
      };

      const createdFeature = {
        id: "1",
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.feature.create.mockResolvedValue(createdFeature);
      mockPrismaService.feature.findFirst.mockResolvedValue(null);

      const result = await service.create(createDto);

      expect(result.name).toBe(createDto.name);
    });

    it("should throw BadRequestException for duplicate feature name", async () => {
      const createDto: CreateFeatureDto = {
        name: "Spellcasting",
        description: "You can cast spells.",
        source: "Player's Handbook",
      };

      mockPrismaService.feature.findFirst.mockResolvedValue({ id: "existing" });

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException for invalid level", async () => {
      const createDto: CreateFeatureDto = {
        name: "Invalid Feature",
        description: "Test",
        source: "Test",
        level: 0, // Invalid level
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("findAll", () => {
    it("should return filtered features by level", async () => {
      const filters = { level: 1 };
      const features = [
        {
          id: "1",
          name: "Spellcasting",
          description: "You can cast spells.",
          source: "Player's Handbook",
          level: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.feature.findMany.mockResolvedValue(features);

      const result = await service.findAll(filters);

      expect(mockPrismaService.feature.findMany).toHaveBeenCalledWith({
        where: { level: 1 },
        orderBy: { name: "asc" },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("findOne", () => {
    it("should return a feature by id", async () => {
      const feature = {
        id: "1",
        name: "Spellcasting",
        description: "You can cast spells.",
        source: "Player's Handbook",
        level: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.feature.findUnique.mockResolvedValue(feature);

      const result = await service.findOne("1");

      expect(result).toEqual(feature);
    });

    it("should throw NotFoundException if feature not found", async () => {
      mockPrismaService.feature.findUnique.mockResolvedValue(null);

      await expect(service.findOne("999")).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("should update a feature successfully", async () => {
      const updateDto: UpdateFeatureDto = {
        description: "Updated description",
      };

      const existingFeature = {
        id: "1",
        name: "Spellcasting",
        description: "Original description",
        source: "Player's Handbook",
        level: 1,
      };

      const updatedFeature = {
        ...existingFeature,
        description: updateDto.description,
        updatedAt: new Date(),
      };

      mockPrismaService.feature.findUnique.mockResolvedValue(existingFeature);
      mockPrismaService.feature.findFirst.mockResolvedValue(null);
      mockPrismaService.feature.update.mockResolvedValue(updatedFeature);

      const result = await service.update("1", updateDto);

      expect(result.description).toBe(updateDto.description);
    });
  });

  describe("remove", () => {
    it("should delete a feature successfully", async () => {
      const feature = {
        id: "1",
        name: "Spellcasting",
        description: "You can cast spells.",
        source: "Player's Handbook",
        level: 1,
      };

      mockPrismaService.feature.findUnique.mockResolvedValue(feature);
      mockPrismaService.character.count.mockResolvedValue(0);
      mockPrismaService.feature.delete.mockResolvedValue(feature);

      await service.remove("1");

      expect(mockPrismaService.feature.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });

    it("should throw BadRequestException if feature is in use", async () => {
      const feature = {
        id: "1",
        name: "Spellcasting",
        description: "You can cast spells.",
        source: "Player's Handbook",
        level: 1,
      };

      mockPrismaService.feature.findUnique.mockResolvedValue(feature);
      mockPrismaService.character.count.mockResolvedValue(1);

      await expect(service.remove("1")).rejects.toThrow(BadRequestException);
    });
  });
});
