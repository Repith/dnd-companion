import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { EventBusService } from "../events/event-bus.service";
import {
  AddItemDto,
  UpdateInventoryItemDto,
  EquipItemDto,
  InventoryResponseDto,
  OwnerType,
} from "./dto";
import { EventType, ItemGivenEvent } from "../events/dto";

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  /**
   * Calculate carrying capacity based on character strength score
   */
  private calculateCarryingCapacity(strengthScore: number): number {
    // DnD 5e carrying capacity: 15 × Strength score
    return 15 * strengthScore;
  }

  /**
   * Calculate total weight of inventory items
   */
  private async calculateTotalWeight(inventoryId: string): Promise<number> {
    const items = await this.prisma.inventoryItem.findMany({
      where: { inventoryId },
      include: { item: true },
    });

    return items.reduce((total, inventoryItem) => {
      return total + inventoryItem.item.weight * inventoryItem.quantity;
    }, 0);
  }

  /**
   * Check if character owns the inventory
   */
  private async checkInventoryOwnership(
    inventoryId: string,
    userId?: string,
  ): Promise<void> {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id: inventoryId },
    });

    if (!inventory) {
      throw new NotFoundException("Inventory not found");
    }

    // For character inventories, check ownership
    if (inventory.ownerType === "CHARACTER") {
      const character = await this.prisma.character.findUnique({
        where: { id: inventory.ownerId },
        select: { ownerId: true },
      });
      if (!character || (userId && character.ownerId !== userId)) {
        throw new ForbiddenException("You don't have access to this inventory");
      }
    }
  }

  /**
   * Get inventory by ID with full details
   */
  async findOne(id: string, userId?: string): Promise<InventoryResponseDto> {
    await this.checkInventoryOwnership(id, userId);

    const inventory = await this.prisma.inventory.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                type: true,
                weight: true,
                rarity: true,
              },
            },
          },
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException("Inventory not found");
    }

    const totalWeight = await this.calculateTotalWeight(id);
    let maxWeight = 150; // Default for sessions

    if (inventory.ownerType === "CHARACTER") {
      const character = await this.prisma.character.findUnique({
        where: { id: inventory.ownerId },
        select: {
          abilityScores: {
            select: { strength: true },
          },
        },
      });
      if (character?.abilityScores?.strength) {
        maxWeight = this.calculateCarryingCapacity(
          character.abilityScores.strength,
        );
      }
    }

    return this.mapToResponseDto(inventory, totalWeight, maxWeight);
  }

  /**
   * Add item to inventory
   */
  async addItem(
    inventoryId: string,
    addItemDto: AddItemDto,
    userId?: string,
  ): Promise<InventoryResponseDto> {
    await this.checkInventoryOwnership(inventoryId, userId);

    // Check if item exists
    const item = await this.prisma.item.findUnique({
      where: { id: addItemDto.itemId },
    });

    if (!item) {
      throw new NotFoundException("Item not found");
    }

    // Check if item already exists in inventory
    const existingItem = await this.prisma.inventoryItem.findFirst({
      where: {
        inventoryId,
        itemId: addItemDto.itemId,
      },
    });

    const quantity = addItemDto.quantity || 1;

    if (existingItem) {
      // Update quantity
      await this.prisma.inventoryItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          notes: addItemDto.notes || existingItem.notes,
        },
      });
    } else {
      // Create new inventory item
      await this.prisma.inventoryItem.create({
        data: {
          inventoryId,
          itemId: addItemDto.itemId,
          quantity,
          ...(addItemDto.notes !== undefined && { notes: addItemDto.notes }),
        },
      });
    }

    // Get inventory for event publishing
    const inventory = await this.prisma.inventory.findUnique({
      where: { id: inventoryId },
    });

    // Determine campaignId for the event (used as sessionId)
    let campaignId: string;
    if (inventory!.ownerType === "SESSION") {
      const session = await this.prisma.session.findUnique({
        where: { id: inventory!.ownerId },
        select: { campaignId: true },
      });
      campaignId = session!.campaignId;
    } else {
      // For character inventories, find the character's campaign
      const character = await this.prisma.character.findUnique({
        where: { id: inventory!.ownerId },
        select: { campaignId: true },
      });
      campaignId = character!.campaignId!;
    }

    // Publish item given event
    const itemEvent: ItemGivenEvent = {
      type: EventType.ITEM_GIVEN,
      targetId: inventory!.ownerId, // The character/session receiving the item
      payload: {
        itemId: addItemDto.itemId,
        quantity: quantity,
      },
      sessionId: campaignId,
    };
    await this.eventBus.publish(itemEvent);

    return this.findOne(inventoryId, userId);
  }

  /**
   * Remove item from inventory
   */
  async removeItem(
    inventoryId: string,
    itemId: string,
    quantity?: number,
    userId?: string,
  ): Promise<InventoryResponseDto> {
    await this.checkInventoryOwnership(inventoryId, userId);

    const inventoryItem = await this.prisma.inventoryItem.findFirst({
      where: {
        inventoryId,
        itemId,
      },
    });

    if (!inventoryItem) {
      throw new NotFoundException("Item not found in inventory");
    }

    const removeQuantity = quantity || inventoryItem.quantity;

    if (removeQuantity >= inventoryItem.quantity) {
      // Remove item completely
      await this.prisma.inventoryItem.delete({
        where: { id: inventoryItem.id },
      });
    } else {
      // Reduce quantity
      await this.prisma.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
          quantity: inventoryItem.quantity - removeQuantity,
        },
      });
    }

    return this.findOne(inventoryId, userId);
  }

  /**
   * Update inventory item
   */
  async updateItem(
    inventoryId: string,
    itemId: string,
    updateDto: UpdateInventoryItemDto,
    userId?: string,
  ): Promise<InventoryResponseDto> {
    await this.checkInventoryOwnership(inventoryId, userId);

    const inventoryItem = await this.prisma.inventoryItem.findFirst({
      where: {
        inventoryId,
        itemId,
      },
    });

    if (!inventoryItem) {
      throw new NotFoundException("Item not found in inventory");
    }

    // Validate quantity
    if (updateDto.quantity !== undefined && updateDto.quantity < 0) {
      throw new BadRequestException("Quantity cannot be negative");
    }

    // If quantity is 0, remove the item
    if (updateDto.quantity === 0) {
      return this.removeItem(inventoryId, itemId, undefined, userId);
    }

    await this.prisma.inventoryItem.update({
      where: { id: inventoryItem.id },
      data: {
        ...(updateDto.quantity !== undefined && {
          quantity: updateDto.quantity,
        }),
        ...(updateDto.equipped !== undefined && {
          equipped: updateDto.equipped,
        }),
        ...(updateDto.notes !== undefined && { notes: updateDto.notes }),
      },
    });

    return this.findOne(inventoryId, userId);
  }

  /**
   * Equip or unequip an item
   */
  async equipItem(
    inventoryId: string,
    itemId: string,
    equipDto: EquipItemDto,
    userId?: string,
  ): Promise<InventoryResponseDto> {
    await this.checkInventoryOwnership(inventoryId, userId);

    const inventoryItem = await this.prisma.inventoryItem.findFirst({
      where: {
        inventoryId,
        itemId,
      },
      include: { item: true },
    });

    if (!inventoryItem) {
      throw new NotFoundException("Item not found in inventory");
    }

    // Validate that equippable items can be equipped
    if (equipDto.equipped) {
      const equippableTypes = ["WEAPON", "ARMOR"];
      if (!equippableTypes.includes(inventoryItem.item.type)) {
        throw new BadRequestException("This item type cannot be equipped");
      }
    }

    await this.prisma.inventoryItem.update({
      where: { id: inventoryItem.id },
      data: { equipped: equipDto.equipped },
    });

    return this.findOne(inventoryId, userId);
  }

  /**
   * Get inventory for a character
   */
  async getCharacterInventory(
    characterId: string,
    userId?: string,
  ): Promise<InventoryResponseDto> {
    // Check if character exists and user has access
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      select: { ownerId: true },
    });

    if (!character) {
      throw new NotFoundException("Character not found");
    }

    if (character.ownerId && character.ownerId !== userId) {
      throw new ForbiddenException("You don't have access to this character");
    }

    // Find inventory for the character
    const inventory = await this.prisma.inventory.findFirst({
      where: {
        ownerType: "CHARACTER",
        ownerId: characterId,
      },
    });

    if (!inventory) {
      throw new NotFoundException("Character has no inventory");
    }

    return this.findOne(inventory.id, userId);
  }

  /**
   * Create inventory for a character (called when character is created)
   */
  async createCharacterInventory(characterId: string): Promise<string> {
    const inventory = await this.prisma.inventory.create({
      data: {
        ownerType: "CHARACTER",
        ownerId: characterId,
      },
    });

    return inventory.id;
  }

  /**
   * Map Prisma inventory to response DTO
   */
  private mapToResponseDto(
    inventory: any,
    totalWeight: number,
    maxWeight: number,
  ): InventoryResponseDto {
    return {
      id: inventory.id,
      ownerType: inventory.ownerType,
      ownerId: inventory.ownerId,
      items: inventory.items.map((item: any) => ({
        id: item.id,
        itemId: item.itemId,
        item: item.item,
        quantity: item.quantity,
        equipped: item.equipped,
        notes: item.notes,
      })),
      encumbrance: {
        currentWeight: totalWeight,
        maxWeight,
        isEncumbered: totalWeight > maxWeight,
      },
    };
  }
}
