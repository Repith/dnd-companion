import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { ItemRepository } from "@dnd-companion/domain";
import { GetItemsQuery } from "../../queries/item/get-items.query";

@Injectable()
@QueryHandler(GetItemsQuery)
export class GetItemsHandler implements IQueryHandler<GetItemsQuery> {
  constructor(private readonly itemRepository: ItemRepository) {}

  async execute(query: GetItemsQuery): Promise<any[]> {
    const { type, rarity, search, userId } = query;

    // TODO: Implement filtering logic in repository or here
    const items = await this.itemRepository.findAll();

    // TODO: Add authorization and filtering based on userId, type, rarity, search

    return items.map((item) => this.mapToResponseDto(item));
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
