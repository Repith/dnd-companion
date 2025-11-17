import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Injectable, NotFoundException } from "@nestjs/common";
import { ItemRepository } from "@dnd-companion/domain";
import { DeleteItemCommand } from "../../commands/item/delete-item.command";

@Injectable()
@CommandHandler(DeleteItemCommand)
export class DeleteItemHandler implements ICommandHandler<DeleteItemCommand> {
  constructor(private readonly itemRepository: ItemRepository) {}

  async execute(command: DeleteItemCommand): Promise<void> {
    const { id, userId } = command;

    // Find existing item
    const existingItem = await this.itemRepository.findById(id);
    if (!existingItem) {
      throw new NotFoundException("Item not found");
    }

    // TODO: Add authorization check based on userId
    // TODO: Check if item is being used in inventories

    // Delete the item
    await this.itemRepository.delete(id);
  }
}
