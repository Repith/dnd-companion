import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Injectable, NotFoundException } from "@nestjs/common";
import { ItemRepository } from "@dnd-companion/domain";
import { GetItemQuery } from "../../queries/item/get-item.query";

@Injectable()
@QueryHandler(GetItemQuery)
export class GetItemHandler implements IQueryHandler<GetItemQuery> {
  constructor(private readonly itemRepository: ItemRepository) {}

  async execute(query: GetItemQuery): Promise<any> {
    const { id, userId } = query;

    const item = await this.itemRepository.findById(id);
    if (!item) {
      throw new NotFoundException("Item not found");
    }

    // TODO: Add authorization check based on userId

    return this.mapToResponseDto(item);
  }

  private mapToResponseDto(item: any): any {
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
      createdAt: new Date(), // TODO: Add timestamps to domain entity
      updatedAt: new Date(),
    };
  }
}
