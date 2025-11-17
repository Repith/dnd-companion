import { Injectable } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { Rarity } from "@dnd-companion/domain";
import { CreateItemDto, UpdateItemDto, ItemResponseDto, ItemType } from "./dto";

// Temporary inline command classes until application lib is built
class CreateItemCommand {
  constructor(
    public readonly name: string,
    public readonly type: ItemType,
    public readonly rarity: Rarity,
    public readonly weight: number,
    public readonly properties?: any,
    public readonly effects?: any,
    public readonly source?: string,
    public readonly description?: string,
    public readonly userId?: string,
  ) {}
}

class UpdateItemCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly type?: ItemType,
    public readonly rarity?: Rarity,
    public readonly weight?: number,
    public readonly properties?: any,
    public readonly effects?: any,
    public readonly source?: string,
    public readonly description?: string,
    public readonly userId?: string,
  ) {}
}

class DeleteItemCommand {
  constructor(public readonly id: string, public readonly userId?: string) {}
}

class GetItemQuery {
  constructor(public readonly id: string, public readonly userId?: string) {}
}

class GetItemsQuery {
  constructor(
    public readonly type?: ItemType,
    public readonly rarity?: Rarity,
    public readonly search?: string,
    public readonly userId?: string,
  ) {}
}

@Injectable()
export class ItemService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Create a new item
   */
  async create(
    createDto: CreateItemDto,
    userId: string,
  ): Promise<ItemResponseDto> {
    const command = new CreateItemCommand(
      createDto.name,
      createDto.type,
      createDto.rarity || Rarity.COMMON,
      createDto.weight || 0,
      createDto.properties,
      createDto.effects,
      createDto.source,
      createDto.description,
      userId,
    );

    const itemId = await this.commandBus.execute(command);
    return this.findOne(itemId, userId);
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
    const query = new GetItemsQuery(
      filters?.type,
      filters?.rarity,
      filters?.search,
      userId,
    );
    return this.queryBus.execute(query);
  }

  /**
   * Find a single item by ID
   */
  async findOne(id: string, userId: string): Promise<ItemResponseDto> {
    const query = new GetItemQuery(id, userId);
    return this.queryBus.execute(query);
  }

  /**
   * Update an item
   */
  async update(
    id: string,
    updateDto: UpdateItemDto,
    userId: string,
  ): Promise<ItemResponseDto> {
    const command = new UpdateItemCommand(
      id,
      updateDto.name,
      updateDto.type,
      updateDto.rarity,
      updateDto.weight,
      updateDto.properties,
      updateDto.effects,
      updateDto.source,
      updateDto.description,
      userId,
    );

    await this.commandBus.execute(command);
    return this.findOne(id, userId);
  }

  /**
   * Delete an item
   */
  async remove(id: string, userId: string): Promise<void> {
    const command = new DeleteItemCommand(id, userId);
    await this.commandBus.execute(command);
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
