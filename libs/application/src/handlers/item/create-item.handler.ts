import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Injectable } from "@nestjs/common";
import { ItemRepository, Item } from "@dnd-companion/domain";
import { CreateItemCommand } from "../../commands/item/create-item.command";

@Injectable()
@CommandHandler(CreateItemCommand)
export class CreateItemHandler implements ICommandHandler<CreateItemCommand> {
  constructor(private readonly itemRepository: ItemRepository) {}

  async execute(command: CreateItemCommand): Promise<string> {
    const {
      name,
      type,
      rarity,
      weight,
      properties,
      effects,
      source,
      description,
      userId,
    } = command;

    // Generate ID (in real app, use UUID)
    const id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const item = new Item(
      id,
      name,
      type,
      rarity,
      weight,
      properties,
      effects,
      source,
      description,
    );

    await this.itemRepository.save(item);

    return id;
  }
}
