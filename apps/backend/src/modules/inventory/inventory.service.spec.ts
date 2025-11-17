import { Test, TestingModule } from "@nestjs/testing";
import { InventoryService } from "./inventory.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { EventBusService } from "../events/event-bus.service";
import {
  AddItemDto,
  UpdateInventoryItemDto,
  EquipItemDto,
  OwnerType,
} from "./dto";
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";

describe("InventoryService", () => {
  let service: InventoryService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    inventory: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    inventoryItem: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    item: {
      findUnique: jest.fn(),
    },
    character: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    campaign: {
      findUnique: jest.fn(),
    },
  };

  const mockEventBusService = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventBusService,
          useValue: mockEventBusService,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findOne", () => {
    it("should return inventory with calculated weight", async () => {
      const inventory = {
        id: "1",
        ownerType: OwnerType.CHARACTER,
        ownerId: "char1",
        items: [
          {
            id: "item1",
            itemId: "item1",
            item: {
              id: "item1",
              name: "Longsword",
              type: "WEAPON",
              weight: 3,
              rarity: "COMMON",
            },
            quantity: 1,
            equipped: false,
            notes: null,
          },
        ],
      };

      mockPrismaService.inventory.findUnique.mockResolvedValue(inventory);
      mockPrismaService.inventoryItem.findMany.mockResolvedValue(
        inventory.items,
      );
      mockPrismaService.character.findUnique.mockResolvedValue({
        ownerId: "user1",
        abilityScores: { strength: 15 },
      });

      const result = await service.findOne("1", "user1");

      expect(result.id).toBe("1");
      expect(result.ownerType).toBe(OwnerType.CHARACTER);
      expect(result.items).toHaveLength(1);
      expect(result.encumbrance?.currentWeight).toBe(3);
      expect(result.encumbrance?.maxWeight).toBe(225); // 15 * 15
      expect(result.encumbrance?.isEncumbered).toBe(false);
    });

    it("should throw ForbiddenException for unauthorized access", async () => {
      const inventory = {
        id: "1",
        ownerType: OwnerType.CHARACTER,
        ownerId: "char1",
      };

      mockPrismaService.inventory.findUnique.mockResolvedValue(inventory);
      mockPrismaService.character.findUnique.mockResolvedValue({
        ownerId: "otherUser",
      });

      await expect(service.findOne("1", "user1")).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("addItem", () => {
    it("should add new item to inventory and publish ITEM_GIVEN event", async () => {
      const addItemDto: AddItemDto = {
        itemId: "item1",
        quantity: 2,
        notes: "Test notes",
      };

      const item = {
        id: "item1",
        name: "Longsword",
        type: "WEAPON",
        weight: 3,
        rarity: "COMMON",
      };

      const inventory = {
        id: "1",
        ownerType: OwnerType.CHARACTER,
        ownerId: "char1",
        items: [
          {
            id: "invItem1",
            inventoryId: "1",
            itemId: "item1",
            item,
            quantity: 2,
            equipped: false,
            notes: "Test notes",
          },
        ],
      };

      mockPrismaService.inventory.findUnique.mockResolvedValue(inventory);
      mockPrismaService.character.findUnique.mockResolvedValue({
        ownerId: "user1",
        campaignId: "campaign-1",
      });
      mockPrismaService.campaign.findUnique.mockResolvedValue(null);
      mockPrismaService.item.findUnique.mockResolvedValue(item);
      mockPrismaService.inventoryItem.findFirst.mockResolvedValue(null);
      mockPrismaService.inventoryItem.create.mockResolvedValue({
        id: "invItem1",
        inventoryId: "1",
        itemId: "item1",
        quantity: 2,
        equipped: false,
        notes: "Test notes",
      });
      // Mock for findOne call at the end
      mockPrismaService.inventoryItem.findMany.mockResolvedValue([
        {
          id: "invItem1",
          inventoryId: "1",
          itemId: "item1",
          item,
          quantity: 2,
          equipped: false,
          notes: "Test notes",
        },
      ]);

      const result = await service.addItem("1", addItemDto, "user1");

      expect(mockPrismaService.inventoryItem.create).toHaveBeenCalledWith({
        data: {
          inventoryId: "1",
          itemId: "item1",
          quantity: 2,
          notes: "Test notes",
        },
      });
      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        type: "ITEM_GIVEN",
        targetId: "char1",
        payload: {
          itemId: "item1",
          quantity: 2,
        },
        campaignId: "campaign-1",
      });
      expect(result).toBeDefined();
    });

    it("should update quantity for existing item and publish ITEM_GIVEN event", async () => {
      const addItemDto: AddItemDto = {
        itemId: "item1",
        quantity: 2,
      };

      const inventory = {
        id: "1",
        ownerType: OwnerType.CHARACTER,
        ownerId: "char1",
        character: {
          ownerId: "user1",
        },
      };

      const existingItem = {
        id: "invItem1",
        inventoryId: "1",
        itemId: "item1",
        quantity: 1,
        equipped: false,
        notes: null,
      };

      mockPrismaService.inventory.findUnique.mockResolvedValue(inventory);
      mockPrismaService.character.findUnique.mockResolvedValue({
        ownerId: "user1",
        campaignId: "campaign-1",
      });
      mockPrismaService.item.findUnique.mockResolvedValue({
        id: "item1",
        name: "Longsword",
      });
      mockPrismaService.inventoryItem.findFirst.mockResolvedValue(existingItem);
      mockPrismaService.inventoryItem.update.mockResolvedValue({
        ...existingItem,
        quantity: 3,
      });

      const result = await service.addItem("1", addItemDto, "user1");

      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: "invItem1" },
        data: {
          quantity: 3,
          notes: null,
        },
      });
      expect(mockEventBusService.publish).toHaveBeenCalledWith({
        type: "ITEM_GIVEN",
        targetId: "char1",
        payload: {
          itemId: "item1",
          quantity: 2,
        },
        campaignId: "campaign-1",
      });
      expect(result).toBeDefined();
    });

    it("should throw NotFoundException for non-existent item", async () => {
      const addItemDto: AddItemDto = {
        itemId: "nonexistent",
      };

      mockPrismaService.inventory.findUnique.mockResolvedValue({
        id: "1",
        character: { ownerId: "user1" },
      });
      mockPrismaService.item.findUnique.mockResolvedValue(null);

      await expect(service.addItem("1", addItemDto, "user1")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("removeItem", () => {
    it("should reduce item quantity", async () => {
      const inventory = {
        id: "1",
        character: { ownerId: "user1" },
      };

      const inventoryItem = {
        id: "invItem1",
        inventoryId: "1",
        itemId: "item1",
        quantity: 3,
      };

      mockPrismaService.inventory.findUnique.mockResolvedValue(inventory);
      mockPrismaService.inventoryItem.findFirst.mockResolvedValue(
        inventoryItem,
      );
      mockPrismaService.inventoryItem.update.mockResolvedValue({
        ...inventoryItem,
        quantity: 1,
      });

      const result = await service.removeItem("1", "item1", 2, "user1");

      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: "invItem1" },
        data: { quantity: 1 },
      });
      expect(result).toBeDefined();
    });

    it("should remove item completely when quantity reaches zero", async () => {
      const inventory = {
        id: "1",
        character: { ownerId: "user1" },
      };

      const inventoryItem = {
        id: "invItem1",
        inventoryId: "1",
        itemId: "item1",
        quantity: 2,
      };

      mockPrismaService.inventory.findUnique.mockResolvedValue(inventory);
      mockPrismaService.inventoryItem.findFirst.mockResolvedValue(
        inventoryItem,
      );
      mockPrismaService.inventoryItem.delete.mockResolvedValue(inventoryItem);

      const result = await service.removeItem("1", "item1", 2, "user1");

      expect(mockPrismaService.inventoryItem.delete).toHaveBeenCalledWith({
        where: { id: "invItem1" },
      });
      expect(result).toBeDefined();
    });
  });

  describe("updateItem", () => {
    it("should update item quantity and equipped status", async () => {
      const updateDto: UpdateInventoryItemDto = {
        quantity: 5,
        equipped: true,
        notes: "Updated notes",
      };

      const inventory = {
        id: "1",
        character: { ownerId: "user1" },
      };

      const inventoryItem = {
        id: "invItem1",
        inventoryId: "1",
        itemId: "item1",
        quantity: 3,
        equipped: false,
        notes: null,
      };

      mockPrismaService.inventory.findUnique.mockResolvedValue(inventory);
      mockPrismaService.inventoryItem.findFirst.mockResolvedValue(
        inventoryItem,
      );
      mockPrismaService.inventoryItem.update.mockResolvedValue({
        ...inventoryItem,
        ...updateDto,
      });

      const result = await service.updateItem("1", "item1", updateDto, "user1");

      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: "invItem1" },
        data: {
          quantity: 5,
          equipped: true,
          notes: "Updated notes",
        },
      });
      expect(result).toBeDefined();
    });

    it("should remove item when quantity set to zero", async () => {
      const updateDto: UpdateInventoryItemDto = {
        quantity: 0,
      };

      const inventory = {
        id: "1",
        character: { ownerId: "user1" },
      };

      const inventoryItem = {
        id: "invItem1",
        inventoryId: "1",
        itemId: "item1",
        quantity: 3,
      };

      mockPrismaService.inventory.findUnique.mockResolvedValue(inventory);
      mockPrismaService.inventoryItem.findFirst.mockResolvedValue(
        inventoryItem,
      );
      mockPrismaService.inventoryItem.delete.mockResolvedValue(inventoryItem);

      const result = await service.updateItem("1", "item1", updateDto, "user1");

      expect(mockPrismaService.inventoryItem.delete).toHaveBeenCalledWith({
        where: { id: "invItem1" },
      });
      expect(result).toBeDefined();
    });
  });

  describe("equipItem", () => {
    it("should equip a weapon successfully", async () => {
      const equipDto: EquipItemDto = {
        equipped: true,
      };

      const inventory = {
        id: "1",
        character: { ownerId: "user1" },
      };

      const inventoryItem = {
        id: "invItem1",
        inventoryId: "1",
        itemId: "item1",
        quantity: 1,
        equipped: false,
      };

      const item = {
        id: "item1",
        name: "Longsword",
        type: "WEAPON",
      };

      mockPrismaService.inventory.findUnique.mockResolvedValue(inventory);
      mockPrismaService.inventoryItem.findFirst.mockResolvedValue(
        inventoryItem,
      );
      mockPrismaService.inventoryItem.update.mockResolvedValue({
        ...inventoryItem,
        equipped: true,
      });

      const result = await service.equipItem("1", "item1", equipDto, "user1");

      expect(mockPrismaService.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: "invItem1" },
        data: { equipped: true },
      });
      expect(result).toBeDefined();
    });

    it("should throw BadRequestException for non-equippable item", async () => {
      const equipDto: EquipItemDto = {
        equipped: true,
      };

      const inventory = {
        id: "1",
        character: { ownerId: "user1" },
      };

      const inventoryItem = {
        id: "invItem1",
        inventoryId: "1",
        itemId: "item1",
        quantity: 1,
        equipped: false,
      };

      const item = {
        id: "item1",
        name: "Potion",
        type: "CONSUMABLE", // Not equippable
      };

      mockPrismaService.inventory.findUnique.mockResolvedValue(inventory);
      mockPrismaService.inventoryItem.findFirst.mockResolvedValue({
        ...inventoryItem,
        item,
      });

      await expect(
        service.equipItem("1", "item1", equipDto, "user1"),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.equipItem("1", "item1", equipDto, "user1"),
      ).rejects.toThrow("This item type cannot be equipped");
    });
  });

  describe("getCharacterInventory", () => {
    it("should return character inventory", async () => {
      const character = {
        id: "char1",
        ownerId: "user1",
        inventoryId: "inv1",
      };

      const inventory = {
        id: "inv1",
        ownerType: OwnerType.CHARACTER,
        ownerId: "char1",
        items: [],
        character: {
          abilityScores: { strength: 12 },
        },
      };

      mockPrismaService.character.findUnique.mockResolvedValue(character);
      mockPrismaService.inventory.findUnique.mockResolvedValue(inventory);
      mockPrismaService.inventoryItem.findMany.mockResolvedValue([]);

      const result = await service.getCharacterInventory("char1", "user1");

      expect(result.id).toBe("inv1");
      expect(result.ownerType).toBe(OwnerType.CHARACTER);
    });

    it("should throw NotFoundException if character has no inventory", async () => {
      const character = {
        id: "char1",
        ownerId: "user1",
        inventoryId: null,
      };

      mockPrismaService.character.findUnique.mockResolvedValue(character);

      await expect(
        service.getCharacterInventory("char1", "user1"),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getCharacterInventory("char1", "user1"),
      ).rejects.toThrow("Character has no inventory");
    });
  });
});
