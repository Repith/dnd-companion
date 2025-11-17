import { IQuery } from "@nestjs/cqrs";
import { ItemType, Rarity } from "@dnd-companion/domain";

export class GetItemsQuery implements IQuery {
  constructor(
    public readonly type?: ItemType,
    public readonly rarity?: Rarity,
    public readonly search?: string,
    public readonly userId?: string,
  ) {}
}
