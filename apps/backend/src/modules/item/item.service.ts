import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  CreateItemDto,
  UpdateItemDto,
  ItemResponseDto,
  ItemType,
  Rarity,
} from "./dto";

@Injectable()
export class ItemService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate DnD item properties
   */
  private validateItemProperties(
    data: Partial<CreateItemDto | UpdateItemDto>,
  ): void {
    // Validate weight
    if (data.weight !== undefined && data.weight < 0) {
      throw new BadRequestException("Item weight cannot be negative");
    }

    // Validate properties based on item type
    if (data.properties) {
      const props = data.properties;

      // Weapon validations
      if (data.type === ItemType.WEAPON) {
        if (!props.damageDice) {
          throw new BadRequestException("Weapons must have damage dice");
        }
        // Basic damage dice validation (e.g., "1d8", "2d6+3")
        const damageDiceRegex = /^\d+d\d+(\+\d+)?$/;
        if (!damageDiceRegex.test(props.damageDice)) {
          throw new BadRequestException("Invalid damage dice format");
        }
      }

      // Armor validations
      if (data.type === ItemType.ARMOR) {
        if (
          props.armorClassBonus !== undefined &&
          (props.armorClassBonus < 0 || props.armorClassBonus > 10)
        ) {
          throw new BadRequestException(
            "Armor class bonus must be between 0 and 10",
          );
        }
      }

      // Consumable validations
      if (data.type === ItemType.CONSUMABLE) {
        if (props.charges !== undefined && props.charges < 0) {
          throw new BadRequestException(
            "Consumable charges cannot be negative",
          );
        }
        if (props.maxCharges !== undefined && props.maxCharges < 1) {
          throw new BadRequestException("Maximum charges must be at least 1");
        }
        if (
          props.charges !== undefined &&
          props.maxCharges !== undefined &&
          props.charges > props.maxCharges
        ) {
          throw new BadRequestException(
            "Current charges cannot exceed maximum charges",
          );
        }
      }
    }

    // Validate effects
    if (data.effects) {
      const effects = data.effects;

      // Validate ability score modifiers
      if (effects.abilityScoreModifiers) {
        const validAbilities = [
          "strength",
          "dexterity",
          "constitution",
          "intelligence",
          "wisdom",
          "charisma",
        ];
        for (const [ability, modifier] of Object.entries(
          effects.abilityScoreModifiers,
        )) {
          if (!validAbilities.includes(ability.toLowerCase())) {
            throw new BadRequestException(`Invalid ability: ${ability}`);
          }
          if (modifier < -10 || modifier > 10) {
            throw new BadRequestException(
              "Ability modifiers must be between -10 and 10",
            );
          }
        }
      }

      // Validate skill modifiers (similar validation could be added)
      if (effects.skillModifiers) {
        for (const [skill, modifier] of Object.entries(
          effects.skillModifiers,
        )) {
          if (modifier < -10 || modifier > 10) {
            throw new BadRequestException(
              "Skill modifiers must be between -10 and 10",
            );
          }
        }
      }

      // Validate saving throw modifiers
      if (effects.savingThrowModifiers) {
        const validAbilities = [
          "strength",
          "dexterity",
          "constitution",
          "intelligence",
          "wisdom",
          "charisma",
        ];
        for (const [ability, modifier] of Object.entries(
          effects.savingThrowModifiers,
        )) {
          if (!validAbilities.includes(ability.toLowerCase())) {
            throw new BadRequestException(
              `Invalid ability for saving throw: ${ability}`,
            );
          }
          if (modifier < -10 || modifier > 10) {
            throw new BadRequestException(
              "Saving throw modifiers must be between -10 and 10",
            );
          }
        }
      }
    }
  }

  /**
   * Create a new item
   */
  async create(
    createDto: CreateItemDto,
    userId: string,
  ): Promise<ItemResponseDto> {
    this.validateItemProperties(createDto);

    const item = await this.prisma.item.create({
      data: {
        name: createDto.name,
        type: createDto.type,
        rarity: createDto.rarity || Rarity.COMMON,
        weight: createDto.weight || 0,
        ...(createDto.properties !== undefined && {
          properties: createDto.properties,
        }),
        ...(createDto.effects !== undefined && { effects: createDto.effects }),
        ...(createDto.source !== undefined && { source: createDto.source }),
        ...(createDto.description !== undefined && {
          description: createDto.description,
        }),
        creatorId: userId,
        visibility: "PUBLIC",
      } as any,
    });

    return this.mapToResponseDto(item);
  }

  /**
   * Find all items with optional filtering
   */
  async findAll(
    userId: string,
    filters?: {
      type?: ItemType;
      rarity?: Rarity;
      search?: string;
    },
  ): Promise<ItemResponseDto[]> {
    const where: any = {
      OR: [{ visibility: "PUBLIC" }, { creatorId: userId }],
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.rarity) {
      where.rarity = filters.rarity;
    }

    if (filters?.search) {
      where.AND = {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
        ],
      };
    }

    const items = await this.prisma.item.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return items.map((item) => this.mapToResponseDto(item));
  }

  /**
   * Find a single item by ID
   */
  async findOne(id: string, userId: string): Promise<ItemResponseDto> {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException("Item not found");
    }

    const itemAny = item as any;
    if (itemAny.visibility !== "PUBLIC" && itemAny.creatorId !== userId) {
      throw new NotFoundException("Item not found");
    }

    return this.mapToResponseDto(item);
  }

  /**
   * Update an item
   */
  async update(
    id: string,
    updateDto: UpdateItemDto,
    userId: string,
  ): Promise<ItemResponseDto> {
    this.validateItemProperties(updateDto);

    // Check if item exists
    const existingItem = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!existingItem) {
      throw new NotFoundException("Item not found");
    }

    const itemAny = existingItem as any;
    if (itemAny.visibility !== "PUBLIC" && itemAny.creatorId !== userId) {
      throw new NotFoundException("Item not found");
    }

    const updatedItem = await this.prisma.item.update({
      where: { id },
      data: {
        ...(updateDto.name !== undefined && { name: updateDto.name }),
        ...(updateDto.type !== undefined && { type: updateDto.type }),
        ...(updateDto.rarity !== undefined && { rarity: updateDto.rarity }),
        ...(updateDto.weight !== undefined && { weight: updateDto.weight }),
        ...(updateDto.properties !== undefined && {
          properties: updateDto.properties,
        }),
        ...(updateDto.effects !== undefined && { effects: updateDto.effects }),
        ...(updateDto.source !== undefined && { source: updateDto.source }),
        ...(updateDto.description !== undefined && {
          description: updateDto.description,
        }),
      },
    });

    return this.mapToResponseDto(updatedItem);
  }

  /**
   * Delete an item
   */
  async remove(id: string, userId: string): Promise<void> {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException("Item not found");
    }

    const itemAny = item as any;
    if (itemAny.visibility !== "PUBLIC" && itemAny.creatorId !== userId) {
      throw new NotFoundException("Item not found");
    }

    // Check if item is being used in any inventories
    const inventoryItemsCount = await this.prisma.inventoryItem.count({
      where: { itemId: id },
    });

    if (inventoryItemsCount > 0) {
      throw new BadRequestException(
        "Cannot delete item that is currently in use by characters or sessions",
      );
    }

    await this.prisma.item.delete({
      where: { id },
    });
  }

  /**
   * Map Prisma item to response DTO
   */
  private mapToResponseDto(item: any): ItemResponseDto {
    return {
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
    };
  }
}
