import { Test, TestingModule } from "@nestjs/testing";
import { ItemService } from "./item.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateItemDto, UpdateItemDto, ItemType, Rarity } from "./dto";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("ItemService", () => {
  let service: ItemService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    item: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    inventoryItem: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ItemService>(ItemService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new item successfully", async () => {
      const createDto: CreateItemDto = {
        name: "Longsword",
        type: ItemType.WEAPON,
        rarity: Rarity.COMMON,
        weight: 3,
        properties: {
          damageDice: "1d8",
          requiredProficiency: "Martial Weapons",
        },
        description: "A standard longsword",
      };

      const createdItem = {
        id: "1",
        name: createDto.name,
        type: createDto.type,
        rarity: createDto.rarity,
        weight: createDto.weight,
        properties: createDto.properties,
        effects: null,
        source: null,
        description: createDto.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.item.create.mockResolvedValue(createdItem);

      const result = await service.create(createDto, "user-1");

      expect(mockPrismaService.item.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          type: createDto.type,
          rarity: createDto.rarity,
          weight: createDto.weight,
          properties: createDto.properties,
          effects: createDto.effects,
          source: createDto.source,
          description: createDto.description,
        },
      });
      expect(result).toEqual({
        id: createdItem.id,
        name: createdItem.name,
        type: createdItem.type,
        rarity: createdItem.rarity,
        weight: createdItem.weight,
        properties: createdItem.properties,
        effects: createdItem.effects,
        source: createdItem.source,
        description: createdItem.description,
        createdAt: createdItem.createdAt,
        updatedAt: createdItem.updatedAt,
      });
    });

    it("should throw BadRequestException for invalid weapon without damage dice", async () => {
      const createDto: CreateItemDto = {
        name: "Invalid Weapon",
        type: ItemType.WEAPON,
        properties: {}, // Missing damageDice
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        "Weapons must have damage dice",
      );
    });

    it("should throw BadRequestException for invalid damage dice format", async () => {
      const createDto: CreateItemDto = {
        name: "Invalid Weapon",
        type: ItemType.WEAPON,
        properties: {
          damageDice: "invalid",
        },
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        "Invalid damage dice format",
      );
    });

    it("should throw BadRequestException for negative weight", async () => {
      const createDto: CreateItemDto = {
        name: "Invalid Item",
        type: ItemType.WEAPON,
        weight: -1,
        properties: {
          damageDice: "1d8",
        },
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        "Item weight cannot be negative",
      );
    });

    it("should throw BadRequestException for invalid ability modifier", async () => {
      const createDto: CreateItemDto = {
        name: "Invalid Item",
        type: ItemType.WEAPON,
        properties: {
          damageDice: "1d8",
        },
        effects: {
          abilityScoreModifiers: {
            strength: 11, // Too high
          },
        },
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        "Ability modifiers must be between -10 and 10",
      );
    });
  });

  describe("findAll", () => {
    it("should return filtered items", async () => {
      const filters = { type: ItemType.WEAPON, rarity: Rarity.RARE };
      const items = [
        {
          id: "1",
          name: "Longsword",
          type: ItemType.WEAPON,
          rarity: Rarity.RARE,
          weight: 3,
          properties: null,
          effects: null,
          source: null,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.item.findMany.mockResolvedValue(items);

      const result = await service.findAll(filters);

      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith({
        where: {
          type: ItemType.WEAPON,
          rarity: Rarity.RARE,
        },
        orderBy: { name: "asc" },
      });
      expect(result).toHaveLength(1);
    });

    it("should return items with search filter", async () => {
      const filters = { search: "sword" };
      const items = [
        {
          id: "1",
          name: "Longsword",
          type: ItemType.WEAPON,
          rarity: Rarity.COMMON,
          weight: 3,
          properties: null,
          effects: null,
          source: null,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.item.findMany.mockResolvedValue(items);

      const result = await service.findAll(filters);

      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: "sword", mode: "insensitive" } },
            { description: { contains: "sword", mode: "insensitive" } },
          ],
        },
        orderBy: { name: "asc" },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("findOne", () => {
    it("should return an item by id", async () => {
      const item = {
        id: "1",
        name: "Longsword",
        type: ItemType.WEAPON,
        rarity: Rarity.COMMON,
        weight: 3,
        properties: null,
        effects: null,
        source: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.item.findUnique.mockResolvedValue(item);

      const result = await service.findOne("1");

      expect(mockPrismaService.item.findUnique).toHaveBeenCalledWith({
        where: { id: "1" },
      });
      expect(result).toEqual({
        id: item.id,
        name: item.name,
        type: item.type,
        rarity: item.rarity,
        weight: item.weight,
        properties: item.properties,
        effects: item.effects,
        source: item.source,
        description: item.description,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
    });

    it("should throw NotFoundException if item not found", async () => {
      mockPrismaService.item.findUnique.mockResolvedValue(null);

      await expect(service.findOne("999")).rejects.toThrow(NotFoundException);
      await expect(service.findOne("999")).rejects.toThrow("Item not found");
    });
  });

  describe("update", () => {
    it("should update an item successfully", async () => {
      const updateDto: UpdateItemDto = {
        name: "Updated Longsword",
        weight: 3.5,
      };

      const existingItem = {
        id: "1",
        name: "Longsword",
        type: ItemType.WEAPON,
        rarity: Rarity.COMMON,
        weight: 3,
        properties: null,
        effects: null,
        source: null,
        description: null,
      };

      const updatedItem = {
        ...existingItem,
        name: updateDto.name,
        weight: updateDto.weight,
        updatedAt: new Date(),
      };

      mockPrismaService.item.findUnique.mockResolvedValue(existingItem);
      mockPrismaService.item.update.mockResolvedValue(updatedItem);

      const result = await service.update("1", updateDto);

      expect(mockPrismaService.item.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: {
          name: updateDto.name,
          weight: updateDto.weight,
        },
      });
      expect(result.name).toBe(updateDto.name);
    });

    it("should throw NotFoundException if item to update not found", async () => {
      mockPrismaService.item.findUnique.mockResolvedValue(null);

      await expect(service.update("999", { name: "Test" })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("remove", () => {
    it("should delete an item successfully", async () => {
      const item = {
        id: "1",
        name: "Longsword",
        type: ItemType.WEAPON,
        rarity: Rarity.COMMON,
        weight: 3,
      };

      mockPrismaService.item.findUnique.mockResolvedValue(item);
      mockPrismaService.inventoryItem.count.mockResolvedValue(0);
      mockPrismaService.item.delete.mockResolvedValue(item);

      await service.remove("1");

      expect(mockPrismaService.item.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });

    it("should throw BadRequestException if item is in use", async () => {
      const item = {
        id: "1",
        name: "Longsword",
        type: ItemType.WEAPON,
        rarity: Rarity.COMMON,
        weight: 3,
      };

      mockPrismaService.item.findUnique.mockResolvedValue(item);
      mockPrismaService.inventoryItem.count.mockResolvedValue(1);

      await expect(service.remove("1")).rejects.toThrow(BadRequestException);
      await expect(service.remove("1")).rejects.toThrow(
        "Cannot delete item that is currently in use by characters or sessions",
      );
    });
  });
});
