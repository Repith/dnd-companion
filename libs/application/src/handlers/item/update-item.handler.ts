import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Injectable, NotFoundException } from "@nestjs/common";
import { ItemRepository } from "@dnd-companion/domain";
import { UpdateItemCommand } from "../../commands/item/update-item.command";

@Injectable()
@CommandHandler(UpdateItemCommand)
export class UpdateItemHandler implements ICommandHandler<UpdateItemCommand> {
  constructor(private readonly itemRepository: ItemRepository) {}

  async execute(command: UpdateItemCommand): Promise<void> {
    const { id, userId, ...updates } = command;

    // Find existing item
    const existingItem = await this.itemRepository.findById(id);
    if (!existingItem) {
      throw new NotFoundException("Item not found");
    }

    // TODO: Add authorization check based on userId

    // Filter out undefined values
    const filteredUpdates: any = {};
    Object.keys(updates).forEach((key) => {
      if (updates[key as keyof typeof updates] !== undefined) {
        filteredUpdates[key] = updates[key as keyof typeof updates];
      }
    });

    // Update the item
    existingItem.update(filteredUpdates);

    // Save the updated item
    await this.itemRepository.save(existingItem);
  }
}
